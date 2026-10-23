import React from 'react';
import { View } from 'react-native';
import { useStore } from '../store';
import { fmtQty, ingName, num, pick, prepPlan } from '../logic';
import { color } from '../theme';
import { Card, Header, Row, RoundButton, Screen, T } from '../components/ui';

function Step({ n, title, hint, lines }) {
  return (
    <Row gap={12} style={{ alignItems: 'flex-start' }}>
      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: color.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
        <T v="bodyStrong" c="accent" center>{n}</T>
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <T v="heading">{title}</T>
        {hint ? <T v="caption" c="muted">{hint}</T> : null}
        {lines.map((l, i) => <T key={i} v="body">• {l}</T>)}
      </View>
    </Row>
  );
}

export default function Prep({ back }) {
  const { state, t, byId } = useStore();
  const lang = state.lang;
  const p = prepPlan(state.plan.map(byId).filter(Boolean), state.servings);
  let n = 0;
  const name = r => `${pick(r.name, lang)} (${r.time} ${t('min')})`;
  return (
    <Screen>
      <RoundButton icon="back" flip label={t('back')} onPress={back} />
      <Header menu={false} title={t('tab_prep')} sub={`${t('prepDishes')}: ${num(p.recipes.length, lang)} · ${t('hours', { h: num(p.hours, lang) })}`} />
      {!p.recipes.length ? <T c="muted">{t('prepEmpty')}</T> : (
        <Card style={{ gap: 18 }}>
          {p.chop.length ? <Step n={++n} title={t('step1')} lines={p.chop.map(c => `${ingName(c.n, lang)}: ${fmtQty(c.q, c.u, lang)}`)} /> : null}
          {p.oven.length ? <Step n={++n} title={t('step2')} hint={t('ovenHint')} lines={p.oven.map(name)} /> : null}
          {p.stove.length ? <Step n={++n} title={t('step3')} lines={p.stove.map(name)} /> : null}
          <Step n={++n} title={t('step4')} lines={p.recipes.map(r => `${pick(r.name, lang)}: ${t('keepsUpTo', { k: r.keep || 3 })}${r.freeze ? t('freezes') : ''}`)} />
        </Card>
      )}
    </Screen>
  );
}
