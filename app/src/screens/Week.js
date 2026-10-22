import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { useStore } from '../store';
import { cost, dayName, hasPrice, money, thisSunday, weekRangeLabel, pick } from '../logic';
import { color, radius } from '../theme';
import { Button, Card, Header, Icon, RoundButton, Row, Screen, T, Tag } from '../components/ui';

export default function Week({ open }) {
  const { state, t, byId, swapDay, buildWeek } = useStore();
  const lang = state.lang;
  const dishes = state.plan.map(byId);
  const total = useMemo(() => dishes.filter(Boolean).reduce((s, r) => s + cost(r, state.servings), 0), [dishes, state.servings]);
  const pct = state.budget ? Math.min(1, total / state.budget) : 0;
  const over = state.budget > 0 && total > state.budget;
  const hasPrep = state.modes.prep && dishes.some(r => r?.tags.includes('prep'));

  return (
    <Screen>
      <Header title={t('yourWeek')} sub={`${weekRangeLabel(thisSunday(), lang)} · ${t('people', { n: state.servings })}`}
        right={<RoundButton icon="swap" bg="surface" c="accent" label={t('autoplan')} onPress={buildWeek} />} />

      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <T v="heading">{money(total, lang)}</T>
          <T v="caption" c="muted">{t('of', { b: money(state.budget, lang) })}</T>
        </Row>
        <View style={{ height: 8, borderRadius: 4, backgroundColor: color.accentSoft, overflow: 'hidden' }}>
          <View style={{ width: `${pct * 100}%`, height: 8, borderRadius: 4, backgroundColor: over ? color.error : color.accent }} />
        </View>
        <T v="caption" c={over ? 'error' : 'accent'}>
          {over ? t('overBudget') : `${t('inBudget')} · ${t('left', { b: money(state.budget - total, lang) })}`}
        </T>
      </Card>

      {hasPrep ? <Button kind="secondary" icon="pot" label={t('openPrep')} onPress={() => open('prep')} /> : null}

      <View style={{ gap: 10 }}>
        {dishes.map((r, d) => (
          <Pressable key={d} onPress={() => r && open('recipe', { id: r.id, day: d })}>
            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 }}>
              <View style={{ width: 54, paddingVertical: 8, borderRadius: radius.card - 4, backgroundColor: color.accentSoft, alignItems: 'center' }}>
                <T v="bodyStrong" c="accent" center>{dayName(d, lang)}</T>
                <T v="label" c="muted" center>{d <= 4 ? t('weeknight') : t('weekend')}</T>
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                {r ? <>
                  <T v="bodyStrong" numberOfLines={2}>{pick(r.name, lang)}</T>
                  <T v="caption" c="muted">{r.time} {t('min')} · {hasPrice(r) ? money(cost(r, state.servings), lang) : t('unknownCost')}</T>
                  <Row gap={6} style={{ flexWrap: 'wrap' }}>{r.tags.map(k => <Tag key={k} k={k} />)}</Row>
                  {state.modes.kids && r.kid ? <T v="caption" c="kids">{t('forKids')} {pick(r.kid, lang)}</T> : null}
                </> : <T c="muted">{t('noDinner')}</T>}
              </View>
              <RoundButton icon="swap" bg="bg" c="muted" size={36} label={t('swapAria', { d: dayName(d, lang) })} onPress={() => swapDay(d)} />
            </Card>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
