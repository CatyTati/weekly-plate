import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { isDemo } from '../auth';
import { listPeople } from '../social';
import { PersonRow, useFollowing } from './People';
import { useStore } from '../store';
import { COOKS, dayName, num, pick } from '../logic';
import { color, tagColor } from '../theme';
import { Button, Card, Field, Header, Pill, Row, Screen, T, Tag } from '../components/ui';

const tint = c => tagColor[c.modes[0]] || tagColor.prep;

export default function Community({ goWeek }) {
  const { state, user, t, byId, toggleFollow, copyPlan } = useStore();
  const lang = state.lang;
  const me = user?.id;
  const [query, setQuery] = useState('');
  const [people, setPeople] = useState(null);
  const { error, setError, busy, followingIds, toggle } = useFollowing(me);
  useEffect(() => {
    const timer = setTimeout(() => listPeople(me, query).then(setPeople).catch(() => setError(true)), 300);
    return () => clearTimeout(timer);
  }, [me, query, setError]);
  const q = query.trim().toLowerCase();
  const cooks = COOKS.filter(c => !q || pick(c.name, lang).toLowerCase().includes(q));
  const followed = COOKS.filter(c => state.following.includes(c.id));
  return (
    <Screen>
      <Header title={t('tab_community')} />
      <Field placeholder={t('searchPeople')} value={query} autoCapitalize="none" autoCorrect={false} returnKeyType="search" onChangeText={setQuery} />

      {isDemo ? null : <>
        <T v="heading">{t('appPeople')}</T>
        {error ? <T c="error">{t('eNetwork')}</T> : null}
        {people && !people.length ? <T c="muted">{q ? t('noPeople') : t('noAppPeople')}</T> : null}
        {(people || []).map(p => (
          <PersonRow key={p.id} person={p} following={followingIds.has(p.id)} busy={busy === p.id} onToggle={() => toggle(p)} />
        ))}
      </>}

      {q ? null : followed.map(c => (
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
      <T v="caption" c="muted">{t('sampleNote')}</T>
      {cooks.map(c => {
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
