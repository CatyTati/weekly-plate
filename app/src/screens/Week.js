import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { useStore } from '../store';
import { cost, dayName, hasPrice, keyToDate, localeOf, money, num, pick, thisSunday, weekKey, weekRangeLabel } from '../logic';
import { color, radius } from '../theme';
import { Button, Card, Header, Icon, RoundButton, Row, Screen, T, Tag } from '../components/ui';

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

  return (
    <Screen>
      <Header title={t('yourWeek')} sub={t('people', { n: state.servings })} />

      <Pressable onPress={() => update({ picking: !picking })} accessibilityRole="button" accessibilityState={{ expanded: picking }}>
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 }}>
          <Icon name="week" c="accent" size={20} />
          <T v="bodyStrong" style={{ flex: 1 }}>{range}</T>
          <T v="label" c="muted">{picking ? '▴' : '▾'}</T>
        </Card>
      </Pressable>

      {picking ? <WeekCalendar month={month} setMonth={m => update({ month: m })} selected={week} onPick={k => update({ week: k, picking: false })} /> : null}

      {past ? (
        <Card>
          <T c="muted">{dishes.some(Boolean) ? t('pastWeek') : t('noHistory')}</T>
        </Card>
      ) : null}

      {hasPrep ? <Button kind="secondary" icon="pot" label={t('openPrep')} onPress={() => open('prep')} /> : null}

      {past && !dishes.some(Boolean) ? null : (
        <View style={{ gap: 10 }}>
          {dishes.map((r, d) => (
            <Pressable key={d} onPress={() => (r ? open('recipe', { id: r.id, day: d }) : locked(d) ? null : choose(d))}>
              <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 }}>
                <View style={{ width: 84, paddingVertical: 8, borderRadius: radius.card - 4, backgroundColor: color.accentSoft, alignItems: 'center' }}>
                  <T v="bodyStrong" c="accent" center>{dayName(d, lang)}</T>
                  <T v="label" c="muted" center>{d <= 4 ? t('weeknight') : t('weekend')}</T>
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  {r ? <>
                    <T v="bodyStrong" numberOfLines={2}>{pick(r.name, lang)}</T>
                    <T v="caption" c="muted">{r.time} {t('min')} · {hasPrice(r) ? money(cost(r, state.servings), lang) : t('unknownCost')}</T>
                    <Row gap={6} style={{ flexWrap: 'wrap' }}>{r.tags.map(k => <Tag key={k} k={k} />)}</Row>
                    {state.modes.kids && r.kid ? <T v="caption" c="kids">{t('forKids')} {pick(r.kid, lang)}</T> : null}
                    {locked(d) ? null : (
                      <Pressable onPress={() => choose(d)} hitSlop={8} accessibilityRole="button" style={{ alignSelf: 'flex-start' }}>
                        <T v="bodyStrong" c="accent">{t('changeRecipe')}</T>
                      </Pressable>
                    )}
                  </> : <T c={locked(d) ? 'muted' : 'accent'}>{locked(d) ? t('noDinner') : t('chooseRecipe')}</T>}
                </View>
                {locked(d) || r ? null : <RoundButton icon="plus" bg="bg" c="accent" size={36} label={t('chooseRecipe')} onPress={() => choose(d)} />}
              </Card>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}
