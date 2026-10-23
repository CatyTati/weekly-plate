// Settings: account, language, home preferences, what the home page shows, log out.
import React, { useState } from 'react';
import { Pressable, Switch, View } from 'react-native';
import { useStore } from '../store';
import { isDemo } from '../auth';
import { TAG_KEYS, firstName } from '../logic';
import { color } from '../theme';
import { Avatar, Card, Field, Header, Pill, Row, Screen, Stepper, T } from '../components/ui';
import { LanguageSwitch } from './Onboarding';

const SECTIONS = ['stories', 'tonight', 'week', 'shortcuts'];

export default function Settings() {
  const { state, user, t, set, toggleMode, toggleHome, logout } = useStore();
  const [confirmOut, setConfirmOut] = useState(false);
  const name = user?.name || firstName(user);

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

      <Card style={{ gap: 12 }}>
        <T v="label" c="muted">{t('household')}</T>
        <Row gap={6} style={{ flexWrap: 'wrap' }}>
          {TAG_KEYS.map(k => <Pill key={k} label={t('mode_' + k)} active={!!state.modes[k]} onPress={() => toggleMode(k)} />)}
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <T>{t('diners')}</T>
          <Stepper value={state.servings} onChange={v => set({ servings: v })} />
        </Row>
        <Field label={t('budgetLabel')} keyboardType="number-pad" value={String(state.budget)}
          onChangeText={v => set({ budget: Math.max(0, Number(v.replace(/\D/g, '')) || 0) })} />
      </Card>

      <Card style={{ gap: 4 }}>
        <T v="label" c="muted">{t('homeShows')}</T>
        {SECTIONS.map(k => (
          <Row key={k} style={{ justifyContent: 'space-between', paddingVertical: 6 }}>
            <T>{t('show_' + k)}</T>
            <Switch value={!!state.homeShows[k]} onValueChange={() => toggleHome(k)} accessibilityLabel={t('show_' + k)}
              trackColor={{ true: color.accent, false: color.line }} thumbColor={color.surface} ios_backgroundColor={color.line} />
          </Row>
        ))}
      </Card>

      <Pressable accessibilityRole="button" onPress={() => (confirmOut ? logout() : setConfirmOut(true))}>
        <Card style={{ alignItems: 'center' }}>
          <T v="bodyStrong" c="error" center>{confirmOut ? t('logoutConfirm') : t('logout')}</T>
        </Card>
      </Pressable>
    </Screen>
  );
}
