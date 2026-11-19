// Settings: account, language, private account, home preferences, what the home page shows,
// log out, the privacy policy and deleting the account.
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Switch, View } from 'react-native';
import { useStore } from '../store';
import { isDemo } from '../auth';
import { getPrivate, setPrivate } from '../social';
import { TAG_KEYS, firstName } from '../logic';
import { color } from '../theme';
import { Avatar, Card, Field, Header, Pill, Row, Screen, Stepper, T } from '../components/ui';
import { LanguageSwitch } from './Onboarding';
import Privacy from './Privacy';


export default function Settings() {
  const { state, user, t, set, toggleMode, logout, deleteAccount } = useStore();
  const [confirmOut, setConfirmOut] = useState(false);
  const [priv, setPriv] = useState(null); // null until loaded
  const [deleting, setDeleting] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  useEffect(() => { getPrivate(user?.id).then(setPriv).catch(() => {}); }, [user?.id]);
  const name = user?.name || firstName(user);

  const askDelete = () => Alert.alert(t('deleteTitle'), t('deleteBody'), [
    { text: t('cancel'), style: 'cancel' },
    { text: t('deleteYes'), style: 'destructive', onPress: async () => {
      setDeleting(true);
      try { await deleteAccount(); }
      catch (e) { setDeleting(false); Alert.alert(t('deleteFailed')); console.warn('delete account', e?.message); }
    } },
  ]);

  return (
    <Screen>
      <Header title={t('settings')} />

      <Card>
        <T v="label" c="muted">{t('account')}</T>
        <Row gap={12}>
          <Avatar letter={name[0]} size={48} />
          <View style={{ flex: 1 }}>
            <T v="heading">{name}</T>
            <T v="caption" c="muted">{user?.email}</T>
            <T v="caption" c="muted">{t('signedInWith', { p: t('provider_' + (user?.provider || 'email')) })}</T>
          </View>
        </Row>
        {isDemo ? <T v="label" c="muted">{t('demoNote')}</T> : null}
      </Card>

      <Card>
        <T v="label" c="muted">{t('language')}</T>
        <LanguageSwitch />
      </Card>

      {isDemo ? null : (
        <Card style={{ gap: 6 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <T>{t('privateAccount')}</T>
            <Switch value={!!priv} disabled={priv === null} onValueChange={v => { setPriv(v); setPrivate(user.id, v).catch(() => setPriv(!v)); }}
              accessibilityLabel={t('privateAccount')} trackColor={{ true: color.accent, false: color.line }} thumbColor={color.surface} ios_backgroundColor={color.line} />
          </Row>
          <T v="caption" c="muted">{t('privateHint')}</T>
        </Card>
      )}

      <Card style={{ gap: 10 }}>
        <T v="label" c="muted">{t('themeLabel')}</T>
        <Row gap={6}>
          {['auto', 'light', 'dark'].map(k => <Pill key={k} label={t('theme_' + k)} active={(state.theme || 'auto') === k} onPress={() => set({ theme: k })} />)}
        </Row>
        <T v="caption" c="muted">{t('themeHint')}</T>
      </Card>

      <Card style={{ gap: 12 }}>
        <T v="label" c="muted">{t('household')}</T>
        <Row gap={6} style={{ flexWrap: 'wrap' }}>
          {TAG_KEYS.map(k => <Pill key={k} label={t('mode_' + k)} active={!!state.modes[k]} onPress={() => toggleMode(k)} />)}
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <T>{t('diners')}</T>
          <Stepper value={state.servings} onChange={v => set({ servings: v })} />
        </Row>
      </Card>

      <Pressable accessibilityRole="button" onPress={() => (confirmOut ? logout() : setConfirmOut(true))}>
        <Card style={{ alignItems: 'center' }}>
          <T v="bodyStrong" c="error" center>{confirmOut ? t('logoutConfirm') : t('logout')}</T>
        </Card>
      </Pressable>

      <Pressable accessibilityRole="link" onPress={() => setShowPrivacy(true)} hitSlop={8} style={{ alignSelf: 'center', paddingVertical: 4 }}>
        <T v="caption" c="muted" center>{t('privacy')}</T>
      </Pressable>
      <Privacy visible={showPrivacy} onClose={() => setShowPrivacy(false)} />
      {deleting ? <ActivityIndicator color={color.error} /> : (
        <Pressable accessibilityRole="button" onPress={askDelete} hitSlop={8} style={{ alignSelf: 'center', paddingVertical: 4 }}>
          <T v="caption" c="error" center>{t('deleteAccount')}</T>
        </Pressable>
      )}
    </Screen>
  );
}
