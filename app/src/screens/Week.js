import React, { useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store';
import { dayName, keyToDate, localeOf, num, pick, thisSunday, weekKey, weekRangeLabel } from '../logic';
import { color, radius } from '../theme';
import { Button, Card, Header, Icon, RoundButton, Row, Screen, T } from '../components/ui';
import FoodArt from '../components/FoodArt';

function shiftMonth(month, by) {
  return new Date(month.getFullYear(), month.getMonth() + by, 1);
}

/** Month calendar. A row is a week, and tapping it chooses that week. */
function WeekCalendar({ month, setMonth, selected, onPick }) {
  const { state, t } = useStore();
  const lang = state.lang;
  const weeks = [];
  for (let d = thisSunday(month); d.getMonth() === month.getMonth() || d < month; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7)) weeks.push(d);
  const today = new Date().toDateString();
  const title = new Intl.DateTimeFormat(localeOf(lang), { month: 'long', year: 'numeric' }).format(month);
  const arrow = (by, label) => (
    <Pressable onPress={() => setMonth(shiftMonth(month, by))} hitSlop={10} accessibilityRole="button" accessibilityLabel={label} style={{ paddingHorizontal: 10 }}>
      <T v="heading" c="accent" style={{ writingDirection: 'ltr' }}>{by < 0 ? '‹' : '›'}</T>
    </Pressable>
  );
  return (
    // Left to right in every language: Sunday on the left, next month on the right.
    <Card style={{ gap: 6, direction: 'ltr' }}>
      <Row style={{ justifyContent: 'space-between' }}>
        {arrow(-1, t('prevMonth'))}
        <T v="bodyStrong" center style={{ flex: 1 }}>{title}</T>
        {arrow(1, t('nextMonth'))}
      </Row>
      <Row>
        {[0, 1, 2, 3, 4, 5, 6].map(d => <T key={d} v="label" c="muted" center style={{ flex: 1 }}>{lang === 'he' ? 'אבגדהוש'[d] : dayName(d, lang).slice(0, 2)}</T>)}
      </Row>
      {weeks.map(start => {
        const key = weekKey(start);
        const on = key === selected;
        return (
          <Pressable key={key} onPress={() => onPick(key)} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={weekRangeLabel(start, lang)}
            style={{ flexDirection: 'row', paddingVertical: 8, borderRadius: 12, backgroundColor: on ? color.accentSoft : 'transparent' }}>
            {[0, 1, 2, 3, 4, 5, 6].map(i => {
              const day = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
              const isToday = day.toDateString() === today;
              return <T key={i} v={isToday ? 'bodyStrong' : 'body'} c={isToday || on ? 'accent' : day.getMonth() === month.getMonth() ? 'ink' : 'muted'} center style={{ flex: 1 }}>{num(day.getDate(), lang)}</T>;
            })}
          </Pressable>
        );
      })}
    </Card>
  );
}

/** What the Week page shows. Kept in App so it survives opening a recipe. */
export const initialWeekView = () => ({ week: weekKey(), month: shiftMonth(new Date(), 0), picking: false });

/** What you can do with a planned dinner: change it or take it off the day. */
function DayMenu({ day, recipe, onChange, onRemove, onClose }) {
  const { state, t, rtl } = useStore();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', direction: rtl ? 'rtl' : 'ltr' }}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.35)' }]} accessibilityLabel={t('close')} onPress={onClose} />
        <View style={{ backgroundColor: color.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, paddingBottom: 22 + insets.bottom, gap: 10 }}>
          <T v="label" c="muted">{dayName(day, state.lang)}</T>
          <T v="title" numberOfLines={2}>{pick(recipe.name, state.lang)}</T>
          <Button icon="swap" label={t('changeRecipe')} onPress={onChange} style={{ marginTop: 6 }} />
          <Pressable onPress={onRemove} accessibilityRole="button" style={({ pressed }) => ({ flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', paddingVertical: 15, borderRadius: radius.pill, backgroundColor: color.errorSoft, opacity: pressed ? 0.85 : 1 })}>
            <Icon name="trash" c="error" size={18} />
            <T v="bodyStrong" c="error">{t('removeFromDay')}</T>
          </Pressable>
          <Pressable onPress={onClose} hitSlop={8} style={{ alignSelf: 'center', paddingTop: 6 }}><T v="bodyStrong" c="muted">{t('cancel')}</T></Pressable>
        </View>
      </View>
    </Modal>
  );
}

/** A small picture of the dish: its first photo, or the drawn table. */
function Thumb({ recipe }) {
  return (
    <View style={{ width: 64, height: 64, borderRadius: 16, overflow: 'hidden' }}>
      {recipe.photos?.[0] ? <Image source={{ uri: recipe.photos[0] }} style={{ width: 64, height: 64 }} /> : <FoodArt height={64} radius={16} />}
    </View>
  );
}

export default function Week({ open, view, setView }) {
  const { state, t, byId } = useStore();
  const lang = state.lang;
  const now = weekKey();
  const { week, month, picking } = view;
  const update = patch => setView(v => ({ ...v, ...patch }));
  const past = week < now;
  const plan = state.weeks[week] || [];
  const dishes = [0, 1, 2, 3, 4, 5, 6].map(d => byId(plan[d]));
  const hasPrep = week === now && state.modes.prep && dishes.some(r => r?.tags.includes('prep'));
  const range = weekRangeLabel(keyToDate(week), lang);
  const choose = day => open('pick', { week, day });
  // Past weeks, and days of this week before today, are history only.
  const locked = d => past || (week === now && d < new Date().getDay());

  const { setDay } = useStore();
  const [menu, setMenu] = useState(null); // day whose menu is open
  const start = keyToDate(week);
  const dateOf = d => new Date(start.getFullYear(), start.getMonth(), start.getDate() + d);
  const todayIdx = week === now ? new Date().getDay() : -1;
  const planned = dishes.filter(Boolean).length;
  const shiftWeek = by => { const s = dateOf(by * 7); update({ week: weekKey(s), month: shiftMonth(s, 0) }); };

  return (
    <Screen>
      <Header title={t('yourWeek')} sub={t('people', { n: state.servings })} />

      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 8 }}>
        <RoundButton icon="back" flip size={36} bg="bg" c="accent" label={t('prevWeek')} onPress={() => shiftWeek(-1)} />
        <Pressable onPress={() => update({ picking: !picking })} accessibilityRole="button" accessibilityState={{ expanded: picking }} style={{ flex: 1 }}>
          <Row gap={8} style={{ justifyContent: 'center' }}>
            <Icon name="week" c="accent" size={18} />
            <T v="bodyStrong">{range}</T>
            <T v="label" c="muted">{picking ? '▴' : '▾'}</T>
          </Row>
        </Pressable>
        <RoundButton icon="next" flip size={36} bg="bg" c="accent" label={t('nextWeekBtn')} onPress={() => shiftWeek(1)} />
      </Card>

      {picking ? <WeekCalendar month={month} setMonth={m => update({ month: m })} selected={week} onPick={k => update({ week: k, picking: false })} /> : null}

      {past ? (
        <Card>
          <T c="muted">{dishes.some(Boolean) ? t('pastWeek') : t('noHistory')}</T>
        </Card>
      ) : (
        <View style={{ gap: 6 }}>
          <T v="caption" c="muted">{t('planned', { n: num(planned, lang) })}</T>
          <View style={{ height: 6, borderRadius: 3, backgroundColor: color.accentSoft, overflow: 'hidden' }}>
            <View style={{ width: `${(planned / 7) * 100}%`, height: 6, borderRadius: 3, backgroundColor: color.accent }} />
          </View>
        </View>
      )}

      {hasPrep ? <Button kind="secondary" icon="pot" label={t('openPrep')} onPress={() => open('prep')} /> : null}

      {past && !dishes.some(Boolean) ? null : (
        <View style={{ gap: 10 }}>
          {dishes.map((r, d) => {
            const date = dateOf(d);
            const isToday = d === todayIdx;
            const off = locked(d);
            return (
              <View key={d} style={{ flexDirection: 'row', gap: 10, alignItems: 'stretch', opacity: off && !r ? 0.55 : 1 }}>
                <View style={{ width: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 18, paddingVertical: 10,
                  backgroundColor: isToday ? color.accent : color.accentSoft }}>
                  <T v="label" c={isToday ? 'onAccent' : 'accent'} center>{isToday ? t('today') : dayName(d, lang)}</T>
                  <T v="title" c={isToday ? 'onAccent' : 'ink'} center>{num(date.getDate(), lang)}</T>
                </View>
                {r ? (
                  <Pressable onPress={() => open('recipe', { id: r.id, day: d })} style={{ flex: 1 }} accessibilityRole="button" accessibilityLabel={pick(r.name, lang)}>
                    <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 10,
                      borderColor: isToday ? color.accent : color.edge, borderWidth: isToday ? 1.5 : 1 }}>
                      <Thumb recipe={r} />
                      <View style={{ flex: 1, gap: 4 }}>
                        <T v="bodyStrong" numberOfLines={2}>{pick(r.name, lang)}</T>
                        <Row gap={6}>
                          <Icon name="clock" c="muted" size={14} />
                          <T v="caption" c="muted">{r.time} {t('min')}</T>
                        </Row>
                        {state.modes.kids && r.kid ? <T v="caption" c="kids" numberOfLines={1}>{t('forKids')} {pick(r.kid, lang)}</T> : null}
                      </View>
                      {off ? null : <RoundButton icon="more" size={34} bg="bg" c="muted" label={t('dayOptions', { d: dayName(d, lang) })} onPress={() => setMenu(d)} />}
                    </Card>
                  </Pressable>
                ) : off ? (
                  <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 14, borderRadius: radius.card, backgroundColor: color.surface, borderWidth: 1, borderColor: color.edge }}>
                    <T c="muted">{t('noDinner')}</T>
                  </View>
                ) : (
                  <Pressable onPress={() => choose(d)} accessibilityRole="button"
                    style={({ pressed }) => ({ flex: 1, minHeight: 72, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', borderRadius: radius.card,
                      borderWidth: 1.5, borderStyle: 'dashed', borderColor: color.accent, backgroundColor: pressed ? color.accentSoft : 'transparent' })}>
                    <Icon name="plus" c="accent" size={18} />
                    <T v="bodyStrong" c="accent">{t('addDinner')}</T>
                  </Pressable>
                )}
              </View>
            );
          })}
        </View>
      )}

      {menu !== null && dishes[menu] ? (
        <DayMenu day={menu} recipe={dishes[menu]} onClose={() => setMenu(null)}
          onChange={() => { const d = menu; setMenu(null); choose(d); }}
          onRemove={() => { setDay(menu, null, week); setMenu(null); }} />
      ) : null}
    </Screen>
  );
}
