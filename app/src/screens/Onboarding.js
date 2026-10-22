import React from 'react';
import { Pressable, View } from 'react-native';
import { useStore } from '../store';
import { LANGS, TAG_KEYS } from '../logic';
import { color, tagColor } from '../theme';
import { Button, Card, Checkbox, Field, Header, Icon, Pill, Row, Screen, Stepper, T } from '../components/ui';

const ICON = { kids: 'kid', budget: 'coin', prep: 'pot', quick: 'clock' };

export function LanguageSwitch() {
  const { state, set } = useStore();
  return (
    <Row gap={6}>
      {LANGS.map(l => <Pill key={l.k} label={l.label} active={state.lang === l.k} onPress={() => set({ lang: l.k })} />)}
    </Row>
  );
}

export default function Onboarding({ onDone }) {
  const { state, t, set, toggleMode, buildWeek } = useStore();
  return (
    <Screen footer={<Button label={t('obBuild')} onPress={() => { buildWeek(); onDone?.(); }} />}>
      <LanguageSwitch />
      <T v="label" c="accent">{t('obStep')}</T>
      <Header title={t('obTitle')} sub={t('obSub')} />
      <View style={{ gap: 10 }}>
        {TAG_KEYS.map(k => {
          const on = !!state.modes[k];
          const [fg, bg] = tagColor[k];
          return (
            <Pressable key={k} accessibilityRole="checkbox" accessibilityState={{ checked: on }} onPress={() => toggleMode(k)}>
              <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: on ? 2 : 0, borderColor: color.accent, paddingVertical: on ? 12 : 14 }}>
                <View style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={ICON[k]} c={fg} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <T v="heading">{t('mode_' + k)}</T>
                  <T v="caption" c="muted">{t('sub_' + k)}</T>
                </View>
                <Checkbox checked={on} />
              </Card>
            </Pressable>
          );
        })}
      </View>
      <Row gap={10} style={{ alignItems: 'stretch' }}>
        <Card style={{ flex: 1, gap: 6 }}>
          <T v="label" c="muted">{t('diners')}</T>
          <Stepper value={state.servings} onChange={v => set({ servings: v })} />
        </Card>
        <Card style={{ flex: 1, gap: 6 }}>
          <Field label={t('budgetLabel')} keyboardType="number-pad" value={String(state.budget)}
            onChangeText={v => set({ budget: Math.max(0, Number(v.replace(/\D/g, '')) || 0) })} />
        </Card>
      </Row>
    </Screen>
  );
}
