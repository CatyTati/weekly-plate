import React, { useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { useStore } from '../store';
import { TAG_KEYS, cost, hasPrice, money, pick } from '../logic';
import { color } from '../theme';
import { Button, Card, Field, Header, Pill, Row, Screen, T, Tag } from '../components/ui';

export default function Recipes({ open }) {
  const { state, t, recipes } = useStore();
  const lang = state.lang;
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const list = recipes.filter(r => (filter === 'all' || r.tags.includes(filter)) && (!q || pick(r.name, lang).toLowerCase().includes(q.toLowerCase())));
  return (
    <Screen>
      <Header title={t('tab_recipes')} />
      <Button kind="secondary" icon="plus" label={t('addRecipe')} onPress={() => open('add')} />
      <Field placeholder={t('search')} value={q} onChangeText={setQ} returnKeyType="search" />
      <Row gap={6} style={{ flexWrap: 'wrap' }}>
        <Pill label={t('all')} active={filter === 'all'} onPress={() => setFilter('all')} />
        {TAG_KEYS.map(k => <Pill key={k} label={t('tag_' + k)} active={filter === k} onPress={() => setFilter(k)} />)}
      </Row>
      {!list.length ? <T c="muted">{t('noMatch')}</T> : null}
      {list.map(r => (
        <Pressable key={r.id} onPress={() => open('recipe', { id: r.id })}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {r.photos?.[0]
              ? <Image source={{ uri: r.photos[0] }} style={{ width: 64, height: 64, borderRadius: 18 }} />
              : <View style={{ width: 64, height: 64, borderRadius: 18, backgroundColor: '#F6E3DA', alignItems: 'center', justifyContent: 'center' }}>
                  <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center' }}>
                    <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: '#E59A86' }} />
                  </View>
                </View>}
            <View style={{ flex: 1, gap: 4 }}>
              <T v="bodyStrong" numberOfLines={2}>{pick(r.name, lang)}{r.custom ? `  · ${t('mine')}` : ''}</T>
              <T v="caption" c="muted">{r.time} {t('min')} · {hasPrice(r) ? t('perServing', { c: money(cost(r, state.servings) / state.servings, lang) }) : t('unknownCost')}</T>
              <Row gap={6} style={{ flexWrap: 'wrap' }}>{r.tags.map(k => <Tag key={k} k={k} />)}</Row>
            </View>
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}
