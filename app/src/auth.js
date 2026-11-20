// Sign in / sign up / log out.
//
// With EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY set (see .env.example)
// this uses Supabase Auth: Google and Apple, email + password, and password reset.
// The same session token is what the Python API checks.
//
// Google and Apple use the phone's own sign-in sheet when the app is a development or store
// build (Google: Android and iOS, needs EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID; Apple: iOS). That
// sheet shows the app's name, "Weekly Plate". In Expo Go those native modules don't exist,
// so it falls back to the system browser, which shows the Supabase address instead.
//
// Without those keys the app runs in demo mode: the account is stored only on the phone,
// so every screen can be tried before a Supabase project exists.
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';

WebBrowser.maybeCompleteAuthSession();

const URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const DEMO_KEY = 'weekly-plate/demo-user';
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const inExpoGo = Constants.executionEnvironment === 'storeClient';

// Native modules are loaded only when they can exist: requiring them in Expo Go throws.
// The require calls stay literal (inside arrow functions) so Metro can bundle them.
function loadNative(load) {
  if (inExpoGo) return null;
  try { return load(); } catch { return null; }
}

export const isDemo = !(URL && KEY);

export const supabase = isDemo ? null : createClient(URL, KEY, {
  auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false, flowType: 'pkce' },
});

/** Error codes the screens translate: eLogin, eExists, eNetwork, eCancelled, eConfirm */
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

export async function signInWithProvider(provider) {
  if (isDemo) return demoSave({ id: 'demo-' + provider, email: provider === 'apple' ? 'you@icloud.com' : 'you@gmail.com', name: '', provider });
  if (provider === 'google') {
    const google = nativeGoogle();
    if (google) return signInWithGoogleNative(google);
  }
  if (provider === 'apple' && Platform.OS === 'ios') {
    const apple = loadNative(() => require('expo-apple-authentication'));
    if (apple && await apple.isAvailableAsync().catch(() => false)) return signInWithAppleNative(apple);
  }
  return signInWithBrowser(provider);
}

let googleConfigured = false;
function nativeGoogle() {
  if (!GOOGLE_WEB_CLIENT_ID || (Platform.OS === 'ios' && !GOOGLE_IOS_CLIENT_ID)) return null;
  const mod = loadNative(() => require('@react-native-google-signin/google-signin'));
  if (!mod?.GoogleSignin) return null;
  if (!googleConfigured) {
    // webClientId makes Google return an ID token that Supabase can check.
    mod.GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID, iosClientId: GOOGLE_IOS_CLIENT_ID, scopes: ['email', 'profile'] });
    googleConfigured = true;
  }
  return mod;
}

async function signInWithGoogleNative({ GoogleSignin, statusCodes }) {
  let idToken;
  try {
    if (Platform.OS === 'android') await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const res = await GoogleSignin.signIn();
    // v13+ returns { type, data }; older versions return the user info directly.
    if (res?.type === 'cancelled') throw new AuthError('eCancelled');
    idToken = res?.data?.idToken ?? res?.idToken;
  } catch (e) {
    if (e instanceof AuthError) throw e;
    if (e?.code === statusCodes?.SIGN_IN_CANCELLED || e?.code === statusCodes?.IN_PROGRESS) throw new AuthError('eCancelled');
    throw new AuthError('eNetwork', e?.message);
  }
  if (!idToken) throw new AuthError('eNetwork', 'Google returned no ID token');
  const { data, error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken });
  if (error) throw mapError(error);
  return toUser(data.user, 'google');
}

async function signInWithAppleNative(apple) {
  let credential;
  try {
    credential = await apple.signInAsync({
      requestedScopes: [apple.AppleAuthenticationScope.FULL_NAME, apple.AppleAuthenticationScope.EMAIL],
    });
  } catch (e) {
    if (e?.code === 'ERR_REQUEST_CANCELED') throw new AuthError('eCancelled');
    throw new AuthError('eNetwork', e?.message);
  }
  if (!credential?.identityToken) throw new AuthError('eNetwork', 'Apple returned no identity token');
  const { data, error } = await supabase.auth.signInWithIdToken({ provider: 'apple', token: credential.identityToken });
  if (error) throw mapError(error);
  // Apple sends the name only the first time, and it isn't in the token: keep it on the account.
  const fullName = [credential.fullName?.givenName, credential.fullName?.familyName].filter(Boolean).join(' ');
  if (fullName && !data.user?.user_metadata?.full_name) {
    const { data: upd } = await supabase.auth.updateUser({ data: { full_name: fullName } });
    if (upd?.user) return toUser(upd.user, 'apple');
  }
  return toUser(data.user, 'apple');
}

async function signInWithBrowser(provider) {
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
  const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { full_name: name.trim() } } });
  if (error) throw mapError(error);
  if (!data.session) throw new AuthError('eConfirm'); // project requires email confirmation
  return toUser(data.user, 'email');
}

export async function sendPasswordReset(email) {
  if (isDemo) return;
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: Linking.createURL('reset-password') });
  if (error) throw mapError(error);
}

export async function signOut() {
  if (isDemo) { await AsyncStorage.removeItem(DEMO_KEY); return; }
  await supabase.auth.signOut();
  // Forget the chosen Google account so the next sign-in lets the user pick again.
  await nativeGoogle()?.GoogleSignin.signOut().catch(() => {});
}

/** Access token for calls to the Python API (Authorization: Bearer …). */
export async function accessToken() {
  if (isDemo) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}
