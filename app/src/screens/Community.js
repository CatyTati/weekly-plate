import React from 'react';
import { View } from 'react-native';
import { useStore } from '../store';
import { COOKS, dayName, num, pick } from '../logic';
import { color, tagColor } from '../theme';
import { Button, Card, Header, Pill, Row, Screen, T, Tag } from '../components/ui';

const tint = c => tagColor[c.modes[0]] || tagColor.prep;

export default function Community({ goWeek }) {
  const { state, t, byId, toggleFollow, copyPlan } = useStore();
  const lang = state.lang;
  const followed = COOKS.filter(c => state.following.includes(c.id));
  return (
    <Screen>
      <Header title={t('tab_community')} sub={t('sampleNote')} />
      {followed.map(c => (
        <Card key={c.id} style={{ gap: 12 }}>
          <Row gap={12}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: tint(c)[1], alignItems: 'center', justifyContent: 'center' }}>
              <T v="heading" c={tint(c)[0]} center>{pick(c.name, lang)[0]}</T>
            </View>
            <View style={{ flex: 1 }}>
              <T v="heading">{pick(c.name, lang)}</T>
              <T v="caption" c="muted">{pick(c.bio, lang)}</T>
            </View>
          </Row>
          <Row gap={6} style={{ flexWrap: 'wrap' }}>{c.modes.map(k => <Tag key={k} k={k} />)}</Row>
          <View style={{ backgroundColor: color.bg, borderRadius: 16, padding: 12, gap: 6 }}>
            {c.plan.slice(0, 4).map((id, d) => (
              <Row key={d} gap={10}>
                <T v="bodyStrong" c="accent" style={{ minWidth: 76 }}>{dayName(d, lang)}</T>
                <T style={{ flex: 1 }} numberOfLines={1}>{pick(byId(id).name, lang)}</T>
              </Row>
            ))}
          </View>
          <Button label={t('copyPlan')} onPress={() => { copyPlan(c.id); goWeek(); }} />
        </Card>
      ))}
      <T v="heading">{t('feedTitle')}</T>
      {COOKS.map(c => {
        const on = state.following.includes(c.id);
        return (
          <Card key={c.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: tint(c)[1], alignItems: 'center', justifyContent: 'center' }}>
              <T v="heading" c={tint(c)[0]} center>{pick(c.name, lang)[0]}</T>
            </View>
            <View style={{ flex: 1 }}>
              <T v="bodyStrong">{pick(c.name, lang)}</T>
              <T v="caption" c="muted">{t('followers', { n: num(c.followers, lang) })}</T>
            </View>
            <Pill label={on ? t('following') : t('follow')} active={!on} c="onAccent" soft="accent" onPress={() => toggleFollow(c.id)} />
          </Card>
        );
      })}
    </Screen>
  );
}
