// Sign in, sign up and password reset.
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useStore } from '../store';
import { isDemo, signInWithEmail, signInWithProvider, signUpWithEmail, sendPasswordReset } from '../auth';
import { validateEmail, validateSignIn, validateSignUp } from '../logic';
import { color, radius, shadow } from '../theme';
import { Button, Checkbox, Field, Header, Row, RoundButton, Screen, T } from '../components/ui';
import { LanguageSwitch } from './Onboarding';

const GoogleLogo = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24">
    <Path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.8z" />
    <Path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z" />
    <Path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1z" />
    <Path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z" />
  </Svg>
);
const AppleLogo = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24">
    <Path fill="#FFFFFF" d="M16.4 12.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.4-.8 1.6 0 2 .8 3.4.8 1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9 0 0-2.8-1.1-2.8-4.1zM13.8 4.9c.7-.9 1.2-2.1 1.1-3.3-1 0-2.3.7-3 1.6-.7.8-1.3 2-1.1 3.2 1.1.1 2.3-.6 3-1.5z" />
  </Svg>
);

function SocialButton({ kind, label, onPress, disabled }) {
  const apple = kind === 'apple';
  return (
    <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled}
      style={({ pressed }) => [{ flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, paddingVertical: 14,
        backgroundColor: apple ? color.ink : color.surface, opacity: pressed || disabled ? 0.75 : 1 }, apple ? null : shadow]}>
      {apple ? <AppleLogo /> : <GoogleLogo />}
      <T v="bodyStrong" c={apple ? 'surface' : 'ink'} center>{label}</T>
    </Pressable>
  );
}

function Divider({ label }) {
  return (
    <Row gap={12}>
      <View style={{ flex: 1, height: 1, backgroundColor: color.line }} />
      <T v="caption" c="muted" center>{label}</T>
      <View style={{ flex: 1, height: 1, backgroundColor: color.line }} />
    </Row>
  );
}

function Logo() {
  return (
    <View style={{ width: 88, height: 88, borderRadius: 28, backgroundColor: color.accentSoft, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' }}>
      <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center', ...shadow }}>
        <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: '#8DBB9D' }} />
      </View>
    </View>
  );
}

function Banner({ text, kind = 'error' }) {
  if (!text) return null;
  const err = kind === 'error';
  return (
    <View accessibilityLiveRegion="polite" style={{ backgroundColor: err ? color.errorSoft : color.accentSoft, borderRadius: 16, padding: 12 }}>
      <T v="caption" c={err ? 'error' : 'accent'}>{text}</T>
    </View>
  );
}

export default function Auth({ onSignedIn }) {
  const { t } = useStore();
  const [mode, setMode] = useState('signin'); // signin | signup | forgot
  const [form, setForm] = useState({ name: '', email: '', password: '', terms: false });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null); // { text, kind }
  const [busy, setBusy] = useState(false);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: undefined })); setMessage(null); };
  const go = m => { setMode(m); setErrors({}); setMessage(null); };

  async function run(fn) {
    setBusy(true); setMessage(null);
    try { const user = await fn(); if (user) onSignedIn(user); }
    catch (e) { setMessage({ text: t(e.code || 'eNetwork'), kind: e.code === 'eConfirm' ? 'info' : 'error' }); }
    finally { setBusy(false); }
  }

  const social = (kind, label) => <SocialButton kind={kind} label={label} disabled={busy} onPress={() => run(() => signInWithProvider(kind))} />;

  const submit = () => {
    if (mode === 'forgot') {
      const err = validateEmail(form.email, t);
      if (err) return setErrors({ email: err });
      return run(async () => { await sendPasswordReset(form.email); setMessage({ text: t('linkSent', { e: form.email.trim() }), kind: 'info' }); return null; });
    }
    const errs = mode === 'signin' ? validateSignIn(form, t) : validateSignUp(form, t);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    run(() => (mode === 'signin' ? signInWithEmail(form.email, form.password) : signUpWithEmail(form.name, form.email, form.password)));
  };

  const primaryLabel = mode === 'signin' ? t('signIn') : mode === 'signup' ? t('createAccount') : t('sendLink');

  return (
    <Screen footer={
      <View style={{ gap: 12 }}>
        {busy ? <ActivityIndicator color={color.accent} /> : <Button label={primaryLabel} onPress={submit} />}
        {mode !== 'forgot' ? (
          <Row gap={6} style={{ justifyContent: 'center' }}>
            <T v="body" c="muted" center>{mode === 'signin' ? t('noAccount') : t('haveAccount')}</T>
            <Pressable onPress={() => go(mode === 'signin' ? 'signup' : 'signin')} hitSlop={8}>
              <T v="bodyStrong" c="accent" center>{mode === 'signin' ? t('signUp') : t('signIn')}</T>
            </Pressable>
          </Row>
        ) : null}
      </View>
    }>
      <LanguageSwitch />
      {mode === 'signin' ? (
        <>
          <View style={{ gap: 10, paddingTop: 16 }}>
            <Logo />
            <T v="display" center>{t('app')}</T>
            <T c="muted" center>{t('tagline')}</T>
          </View>
          {social('google', t('withGoogle'))}
          {social('apple', t('withApple'))}
          <Divider label={t('orEmail')} />
        </>
      ) : (
        <>
          <RoundButton icon="back" flip label={t('back')} onPress={() => go('signin')} />
          <Header title={mode === 'signup' ? t('createAccount') : t('forgotTitle')} sub={mode === 'signup' ? t('createSub') : t('forgotSub')} />
          {mode === 'signup' ? <>{social('google', t('signupGoogle'))}<Divider label={t('or')} /></> : null}
        </>
      )}

      <Banner text={message?.text} kind={message?.kind} />

      {mode === 'signup' ? <Field label={t('name')} value={form.name} autoComplete="name" textContentType="name" maxLength={40} error={errors.name} onChangeText={v => set('name', v)} /> : null}
      <Field label={t('email')} value={form.email} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="emailAddress"
        error={errors.email} onChangeText={v => set('email', v)} />
      {mode !== 'forgot' ? (
        <Field label={mode === 'signup' ? `${t('password')} · ${t('passHint')}` : t('password')} value={form.password} secureTextEntry autoCapitalize="none"
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} textContentType={mode === 'signup' ? 'newPassword' : 'password'}
          error={errors.password} onChangeText={v => set('password', v)} onSubmitEditing={submit} />
      ) : null}

      {mode === 'signin' ? (
        <Pressable onPress={() => go('forgot')} hitSlop={8} style={{ alignSelf: 'flex-start' }}><T v="bodyStrong" c="accent">{t('forgot')}</T></Pressable>
      ) : null}

      {mode === 'signup' ? (
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: form.terms }} onPress={() => set('terms', !form.terms)}>
          <Row gap={10} style={{ alignItems: 'flex-start' }}>
            <Checkbox checked={form.terms} />
            <View style={{ flex: 1, gap: 4 }}>
              <T v="caption" c="muted">{t('terms')}</T>
              {errors.terms ? <T v="caption" c="error">{errors.terms}</T> : null}
            </View>
          </Row>
        </Pressable>
      ) : null}

      {isDemo ? <T v="label" c="muted" center>{t('demoNote')}</T> : null}
    </Screen>
  );
}
