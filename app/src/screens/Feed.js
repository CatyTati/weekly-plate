// Feed: posts from people you follow will show here. Until then it points to the community.
// CopyWeekSheet is also used on profiles.
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store';
import { useNav } from '../nav';
import { dayName, keyToDate, num, pick, thisSunday, weekKey, weekRangeLabel } from '../logic';
import { color } from '../theme';
import { Button, Card, Header, Row, Screen, T } from '../components/ui';
import { SourceInfo } from './AddToWeek';

/**
 * Asks which week to copy someone's week into, and says what will change.
 * `theirs` holds their recipes, which are copied into yours.
 */
export function CopyWeekSheet({ cook, theirs, nameOf, onClose }) {
  const { state, t, rtl, byId, copyWeekFrom } = useStore();
  const { showWeek } = useNav();
  const insets = useSafeAreaInsets();
  const lang = state.lang;
  const today = new Date().getDay();
  const weeks = [0, 1, 2, 3].map(i => {
    const start = thisSunday(); start.setDate(start.getDate() + 7 * i);
    return { i, key: weekKey(start) };
  });
  const [chosen, setChosen] = useState(weeks[1].key);
  const name = pick(cook.name, lang);
  const weekName = i => (i === 0 ? t('thisWeek') : i === 1 ? t('nextWeek') : t('inWeeks', { n: num(i, lang) }));
  const replaced = (key, i) => (state.weeks[key] || []).filter((id, d) => id && (i > 0 || d >= today)).length;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', direction: rtl ? 'rtl' : 'ltr' }}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(58,51,64,0.28)' }]} accessibilityLabel={t('close')} onPress={onClose} />
        <View style={{ backgroundColor: color.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '88%', marginTop: insets.top }}>
          <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 22 + insets.bottom, gap: 14 }}>
          <T v="title">{t('copyTitle', { n: name })}</T>
          <SourceInfo cook={cook} whole />
          <T c="muted">{t('copyExplain', { n: name })}</T>
          <Card style={{ gap: 6, paddingVertical: 12 }}>
            {cook.plan.map((id, d) => (id ? (
              <Row key={d} gap={10}>
                <T v="label" c="accent" style={{ minWidth: 64 }}>{dayName(d, lang)}</T>
                <T v="caption" style={{ flex: 1 }} numberOfLines={1}>{nameOf ? nameOf(id) : pick(byId(id)?.name, lang)}</T>
              </Row>
            ) : null))}
          </Card>
          <T v="bodyStrong">{t('copyWhich')}</T>
          <View style={{ gap: 8 }}>
            {weeks.map(({ i, key }) => {
              const on = key === chosen;
              const n = replaced(key, i);
              return (
                <Pressable key={key} onPress={() => setChosen(key)} accessibilityRole="radio" accessibilityState={{ checked: on }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, borderWidth: 2, borderColor: on ? color.accent : color.line, backgroundColor: on ? color.accentSoft : color.surface }}>
                  <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: on ? color.accent : color.line, alignItems: 'center', justifyContent: 'center' }}>
                    {on ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color.accent }} /> : null}
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <T v="bodyStrong">{weekName(i)} · {weekRangeLabel(keyToDate(key), lang)}</T>
                    <T v="caption" c={n ? 'error' : 'muted'}>
                      {[i === 0 ? t('copyFromToday') : null, n ? t('copyReplaces', { n: num(n, lang) }) : t('copyEmpty')].filter(Boolean).join(' · ')}
                    </T>
                  </View>
                </Pressable>
              );
            })}
          </View>
          <Button label={t('copyDo')} onPress={() => { copyWeekFrom(cook.plan, theirs, chosen); onClose(); showWeek(chosen); }} />
          <Pressable onPress={onClose} hitSlop={8} style={{ alignSelf: 'center' }}><T v="bodyStrong" c="muted">{t('cancel')}</T></Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function Feed() {
  const { t } = useStore();
  const { go } = useNav();
  return (
    <Screen>
      <Header title={t('feed')} />
      <Card style={{ alignItems: 'center', gap: 12 }}>
        <T c="muted" center>{t('feedEmpty')}</T>
        <Button label={t('findCooks')} onPress={() => go('community')} />
      </Card>
    </Screen>
  );
}
