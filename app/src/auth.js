// Sign in / sign up / log out.
//
// With EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY set (see .env.example)
// this uses Supabase Auth: Google and Apple, email + password, and password reset.
// Google uses the phone's own account picker when EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is set
// (it shows "Weekly Plate"; the browser page shows the Supabase address instead), and the
// browser otherwise, or in Expo Go. Apple uses iOS's own sheet. The same session token is what the Python API checks.
//
// Without those keys the app runs in demo mode: the account is stored only on the phone,
// so every screen can be tried before a Supabase project exists.
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';

WebBrowser.maybeCompleteAuthSession();

const URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const DEMO_KEY = 'weekly-plate/demo-user';
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

export const isDemo = !(URL && KEY);

export const supabase = isDemo ? null : createClient(URL, KEY, {
  auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false, flowType: 'pkce' },
});

/** Error codes the screens translate: eLogin, eExists, eNetwork, eCancelled, eConfirm, eRate, eSamePass */
export class AuthError extends Error {
  constructor(code, detail) { super(detail || code); this.code = code; }
}

const toUser = (u, provider) => u && ({
  id: u.id,
  email: u.email,
  name: u.user_metadata?.full_name || u.user_metadata?.name || '',
  provider: provider || u.app_metadata?.provider || 'email',
});

function mapError(e) {
  const m = String(e?.message || e || '').toLowerCase();
  if (m.includes('invalid login')) return new AuthError('eLogin');
  if (m.includes('already registered') || m.includes('already exists')) return new AuthError('eExists');
  if (m.includes('email not confirmed')) return new AuthError('eConfirm');
  if (e?.status === 429 || m.includes('rate limit')) return new AuthError('eRate');
  if (m.includes('network') || m.includes('fetch')) return new AuthError('eNetwork');
  return new AuthError('eNetwork', e?.message);
}

export async function currentUser() {
  if (isDemo) {
    try { const raw = await AsyncStorage.getItem(DEMO_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
  }
  const { data } = await supabase.auth.getSession();
  return toUser(data.session?.user);
}

export function onAuthChange(cb) {
  if (isDemo) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_e, session) => cb(toUser(session?.user)));
  return () => data.subscription.unsubscribe();
}

async function demoSave(user) {
  await AsyncStorage.setItem(DEMO_KEY, JSON.stringify(user));
  return user;
}

/** True on an iPhone, where Sign in with Apple uses the system's own sheet. */
export async function appleAvailable() {
  if (Platform.OS !== 'ios') return false;
  return AppleAuthentication.isAvailableAsync().catch(() => false);
}

/**
 * Sign in with Apple through iOS's own sheet (Face ID, no browser). Apple signs a token for
 * this app and Supabase checks it; the nonce ties that token to this one sign-in.
 */
async function signInWithApple() {
  const nonce = Crypto.randomUUID();
  let cred;
  try {
    cred = await AppleAuthentication.signInAsync({
      requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
      nonce: await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, nonce),
    });
  } catch (e) {
    if (e?.code === 'ERR_REQUEST_CANCELED') throw new AuthError('eCancelled');
    throw new AuthError('eNetwork', e?.message);
  }
  if (!cred.identityToken) throw new AuthError('eNetwork', 'no identity token');
  const { data, error } = await supabase.auth.signInWithIdToken({ provider: 'apple', token: cred.identityToken, nonce });
  if (error) throw mapError(error);
  // Apple gives the name only the first time someone signs in to the app, so keep it then.
  const full = [cred.fullName?.givenName, cred.fullName?.familyName].filter(Boolean).join(' ');
  if (full && !data.user.user_metadata?.full_name) {
    const upd = await supabase.auth.updateUser({ data: { full_name: full } });
    if (!upd.error) return toUser(upd.data.user, 'apple');
  }
  return toUser(data.user, 'apple');
}

// The Google module is native: it isn't in Expo Go, and on iOS it needs its own client ID.
let googleModule;
function nativeGoogle() {
  if (googleModule !== undefined) return googleModule;
  googleModule = null;
  if (!GOOGLE_WEB_CLIENT_ID || Constants.executionEnvironment === 'storeClient') return null;
  if (Platform.OS === 'ios' && !GOOGLE_IOS_CLIENT_ID) return null;
  try {
    const mod = require('@react-native-google-signin/google-signin');
    // webClientId makes Google return an ID token that Supabase can check.
    mod.GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID, iosClientId: GOOGLE_IOS_CLIENT_ID });
    googleModule = mod;
  } catch { /* not in this build */ }
  return googleModule;
}

/** Sign in with Google through the phone's own account picker, then hand the token to Supabase. */
async function signInWithGoogle({ GoogleSignin, statusCodes }) {
  let idToken;
  try {
    if (Platform.OS === 'android') await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const res = await GoogleSignin.signIn();
    if (res?.type === 'cancelled') throw new AuthError('eCancelled');
    idToken = res?.data?.idToken ?? res?.idToken; // v13+ wraps the result in { type, data }
  } catch (e) {
    if (e instanceof AuthError) throw e;
    if (e?.code === statusCodes?.SIGN_IN_CANCELLED || e?.code === statusCodes?.IN_PROGRESS) throw new AuthError('eCancelled');
    throw new AuthError('eNetwork', e?.message);
  }
  if (!idToken) throw new AuthError('eNetwork', 'no id token');
  const { data, error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken });
  if (error) throw mapError(error);
  return toUser(data.user, 'google');
}

export async function signInWithProvider(provider) {
  if (isDemo) return demoSave({ id: 'demo-' + provider, email: provider === 'apple' ? 'you@icloud.com' : 'you@gmail.com', name: '', provider });
  if (provider === 'apple' && Platform.OS === 'ios') return signInWithApple();
  const google = provider === 'google' ? nativeGoogle() : null;
  if (google) return signInWithGoogle(google);
  const redirectTo = Linking.createURL('auth-callback');
  const { data, error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo, skipBrowserRedirect: true } });
  if (error) throw mapError(error);
  const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (res.type !== 'success') throw new AuthError('eCancelled');
  const { queryParams } = Linking.parse(res.url);
  const code = queryParams?.code;
  if (!code) throw new AuthError('eCancelled', queryParams?.error_description);
  const { data: s, error: e2 } = await supabase.auth.exchangeCodeForSession(code);
  if (e2) throw mapError(e2);
  return toUser(s.user, provider);
}

/** True for the link in a password reset email. */
export function isRecoveryLink(url) {
  if (isDemo || !url) return false;
  const { path, queryParams } = Linking.parse(url);
  return !!queryParams?.code && !!path?.endsWith('reset-password');
}

/** Finishes sign-in when a confirmation or password reset email's link opens the app. */
export async function handleAuthLink(url) {
  if (isDemo || !url) return;
  const code = Linking.parse(url).queryParams?.code;
  if (code) await supabase.auth.exchangeCodeForSession(code);
}

export async function signInWithEmail(email, password) {
  if (isDemo) {
    const saved = await currentUser().catch(() => null);
    return demoSave({ id: 'demo-email', email: email.trim(), name: saved?.email === email.trim() ? saved.name : '', provider: 'email' });
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw mapError(error);
  return toUser(data.user, 'email');
}

export async function signUpWithEmail(name, email, password) {
  if (isDemo) return demoSave({ id: 'demo-email', email: email.trim(), name: name.trim(), provider: 'email' });
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(), password,
    options: { data: { full_name: name.trim() }, emailRedirectTo: Linking.createURL('auth-callback') },
  });
  if (error) throw mapError(error);
  // With email confirmation on, Supabase hides a taken address: no error, but no identities either.
  if (data.user && data.user.identities?.length === 0) throw new AuthError('eExists');
  if (!data.session) throw new AuthError('eConfirm'); // project requires email confirmation
  return toUser(data.user, 'email');
}

export async function sendPasswordReset(email) {
  if (isDemo) return;
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: Linking.createURL('reset-password') });
  if (error) throw mapError(error);
}

export async function updatePassword(password) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw String(error.message).toLowerCase().includes('different') ? new AuthError('eSamePass') : mapError(error);
}

export async function signOut() {
  if (isDemo) { await AsyncStorage.removeItem(DEMO_KEY); return; }
  await supabase.auth.signOut();
  // Forget the chosen Google account so the next sign-in lets the user pick again.
  await nativeGoogle()?.GoogleSignin.signOut().catch(() => {});
}

/**
 * Deletes the signed-in account for good: first its photo files, then the account itself,
 * which takes every recipe, plan and follow with it (see delete_my_account in the database).
 * Returns the deleted account's id.
 */
export async function deleteAccount() {
  if (isDemo) { await AsyncStorage.removeItem(DEMO_KEY); return null; }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError('eNetwork', 'signed out');
  const photos = supabase.storage.from('recipe-photos');
  for (;;) {
    const { data, error } = await photos.list(user.id, { limit: 100 });
    if (error) throw new AuthError('eNetwork', error.message);
    if (!data.length) break;
    const del = await photos.remove(data.map(f => `${user.id}/${f.name}`));
    if (del.error) throw new AuthError('eNetwork', del.error.message);
    if (!del.data?.length) break; // nothing could be removed; don't loop forever
  }
  const { error } = await supabase.rpc('delete_my_account');
  if (error) throw new AuthError('eNetwork', error.message);
  // The account is gone on the server, so only the copy of the session on this phone is left.
  await supabase.auth.signOut({ scope: 'local' });
  await nativeGoogle()?.GoogleSignin.signOut().catch(() => {});
  return user.id;
}

/** Access token for calls to the Python API (Authorization: Bearer …). */
export async function accessToken() {
  if (isDemo) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}
