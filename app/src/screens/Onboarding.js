import React, { useRef, useState } from 'react';
import { Dimensions, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useStore } from '../store';
import { LANGS, TAG_KEYS } from '../logic';
import { color, onThemeChange, radius, shadow, tagColor } from '../theme';
import { Button, Card, Checkbox, Field, Header, Icon, Row, Screen, Stepper, T } from '../components/ui';

const ICON = { kids: 'kid', budget: 'coin', prep: 'pot', quick: 'clock' };

const FLAG = { he: '🇮🇱', en: '🇬🇧', ru: '🇷🇺' };

export function LanguageSwitch() {
  const { state, set, rtl, t } = useStore();
  const [anchor, setAnchor] = useState(null); // button position while the list is open
  const button = useRef(null);
  const current = LANGS.find(l => l.k === state.lang) || LANGS[0];

  const open = () => button.current?.measureInWindow((x, y, width, height) => setAnchor({ x, y, width, height }));
  const pick = k => { set({ lang: k }); setAnchor(null); };
  const side = anchor && (rtl ? { right: Dimensions.get('window').width - anchor.x - anchor.width } : { left: anchor.x });

  return (
    <>
      <Pressable ref={button} accessibilityRole="button" accessibilityLabel={`${t('language')}: ${current.label}`} accessibilityState={{ expanded: !!anchor }}
        onPress={open} hitSlop={6} style={st.langButton}>
        <Text style={st.flag}>{FLAG[current.k]}</Text>
        <T v="label" c="muted">{current.label}</T>
        <T v="label" c="muted">▾</T>
      </Pressable>
      <Modal visible={!!anchor} transparent animationType="fade" onRequestClose={() => setAnchor(null)}>
        <Pressable accessibilityLabel={t('back')} style={StyleSheet.absoluteFill} onPress={() => setAnchor(null)} />
        {anchor ? (
          <View style={[st.langMenu, side, { top: anchor.y + anchor.height + 6, direction: rtl ? 'rtl' : 'ltr' }]}>
            {LANGS.map(l => (
              <Pressable key={l.k} accessibilityRole="menuitem" accessibilityState={{ selected: l.k === current.k }} onPress={() => pick(l.k)}
                style={({ pressed }) => [st.langItem, l.k === current.k || pressed ? { backgroundColor: color.accentSoft } : null]}>
                <Text style={st.flag}>{FLAG[l.k]}</Text>
                <T v="body" c={l.k === current.k ? 'accent' : 'ink'}>{l.label}</T>
              </Pressable>
            ))}
          </View>
        ) : null}
      </Modal>
    </>
  );
}

let st;
const makeStyles = () => StyleSheet.create({
  langButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 8, backgroundColor: color.surface, borderWidth: 1, borderColor: color.line, borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: 14 },
  flag: { fontSize: 20 },
  langMenu: { position: 'absolute', minWidth: 170, padding: 6, gap: 2, backgroundColor: color.surface, borderRadius: 16, ...shadow },
  langItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12 },
});
onThemeChange(() => { st = makeStyles(); });


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
      </Row>
    </Screen>
  );
}
