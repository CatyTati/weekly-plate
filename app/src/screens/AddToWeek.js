// Adds one recipe to a day: choose the week, then the day, and see what it replaces.
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store';
import { useNav } from '../nav';
import { dayName, keyToDate, num, pick, thisSunday, weekKey, weekRangeLabel } from '../logic';
import { color } from '../theme';
import { Avatar, Button, Row, T } from '../components/ui';

const DAYS = [0, 1, 2, 3, 4, 5, 6];

/** Who it comes from, how much of it, and for how many people. */
export function SourceInfo({ cook, whole }) {
  const { state, t } = useStore();
  const lang = state.lang;
  const name = cook ? pick(cook.name, lang) : null;
  return (
    <View style={{ backgroundColor: color.surface, borderRadius: 16, padding: 12, gap: 4 }}>
      <Row gap={10}>
        {name ? <Avatar letter={name[0]} size={32} /> : null}
        <View style={{ flex: 1 }}>
          {name ? <T v="bodyStrong">{t('srcFrom', { n: name })}</T> : null}
          <T v="caption" c="muted">{whole ? t('srcWeek') : t('srcOne')} · {t('srcServes')}</T>
        </View>
      </Row>
      <T v="caption" c="accent">{t('srcYours', { n: num(state.servings, lang) })}</T>
    </View>
  );
}

export default function AddToWeekSheet({ id, cook, onClose }) {
  const { state, t, rtl, byId, setDay } = useStore();
  const { showWeek } = useNav();
  const insets = useSafeAreaInsets();
  const lang = state.lang;
  const today = new Date().getDay();
  const weeks = [0, 1, 2, 3].map(i => {
    const start = thisSunday(); start.setDate(start.getDate() + 7 * i);
    return { i, key: weekKey(start) };
  });
  const [week, setWeek] = useState(weeks[0].key);
  const locked = d => week === weeks[0].key && d < today;
  const plan = state.weeks[week] || [];
  const firstFree = DAYS.find(d => !locked(d) && !plan[d]);
  const [day, setDayChoice] = useState(firstFree ?? today);
  const weekName = i => (i === 0 ? t('thisWeek') : i === 1 ? t('nextWeek') : t('inWeeks', { n: num(i, lang) }));

  const chooseWeek = key => {
    setWeek(key);
    const p = state.weeks[key] || [];
    const open = DAYS.filter(d => key !== weeks[0].key || d >= today);
    setDayChoice(open.find(d => !p[d]) ?? open[0]);
  };
  const save = () => { setDay(day, id, week); onClose(); showWeek?.(week); };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', direction: rtl ? 'rtl' : 'ltr' }}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(58,51,64,0.28)' }]} accessibilityLabel={t('close')} onPress={onClose} />
        <View style={{ backgroundColor: color.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '88%', marginTop: insets.top }}>
          <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 22 + insets.bottom, gap: 12 }}>
          <T v="title">{t('addWhere', { n: pick(byId(id)?.name, lang) })}</T>
          <SourceInfo cook={cook} />

          <T v="bodyStrong">{t('whichWeek')}</T>
          <Row gap={6} style={{ flexWrap: 'wrap' }}>
            {weeks.map(({ i, key }) => {
              const on = key === week;
              return (
                <Pressable key={key} onPress={() => chooseWeek(key)} accessibilityRole="radio" accessibilityState={{ checked: on }}
                  style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 14, borderWidth: 2, borderColor: on ? color.accent : color.line, backgroundColor: on ? color.accentSoft : color.surface }}>
                  <T v="label" c={on ? 'accent' : 'ink'}>{weekName(i)}</T>
                  <T v="label" c="muted">{weekRangeLabel(keyToDate(key), lang)}</T>
                </Pressable>
              );
            })}
          </Row>

          <T v="bodyStrong">{t('pickDay')}</T>
          <View style={{ gap: 6 }}>
            {DAYS.map(d => {
              const off = locked(d);
              const on = !off && d === day;
              const current = byId(plan[d]);
              return (
                <Pressable key={d} disabled={off} onPress={() => setDayChoice(d)} accessibilityRole="radio" accessibilityState={{ checked: on, disabled: off }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 14, borderWidth: 2,
                    borderColor: on ? color.accent : 'transparent', backgroundColor: on ? color.accentSoft : color.surface, opacity: off ? 0.45 : 1 }}>
                  <T v="bodyStrong" c={on ? 'accent' : 'ink'} style={{ minWidth: 72 }}>{dayName(d, lang)}</T>
                  <T v="caption" c={on && current ? 'error' : 'muted'} style={{ flex: 1 }} numberOfLines={1}>
                    {off ? t('dayPassed') : current ? (on ? t('willReplace', { n: pick(current.name, lang) }) : pick(current.name, lang)) : t('copyEmpty')}
                  </T>
                </Pressable>
              );
            })}
          </View>

          <Button label={t('addDo', { d: dayName(day, lang) })} onPress={save} />
          <Pressable onPress={onClose} hitSlop={8} style={{ alignSelf: 'center' }}><T v="bodyStrong" c="muted">{t('cancel')}</T></Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
