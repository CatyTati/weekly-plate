import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useStore } from '../store';
import { TAG_KEYS, cost, dayName, hasPrice, money, num, pick } from '../logic';
import { RECIPE_DESC } from '../strings2';
import { color } from '../theme';
import { Button, Card, Field, Header, Icon, Pill, Row, RoundButton, Screen, T, Tag } from '../components/ui';
import PhotoSlider from '../components/PhotoSlider';

const PICTURE = 130;
const likeKey = r => `recipe:${r.id}`; // feed posts share state.liked
const describe = (r, lang) => pick(r.desc || RECIPE_DESC[r.id], lang);

function Plate({ height, colors = [color.plate, color.plateDot] }) {
  return (
    <View style={{ height, borderRadius: 18, backgroundColor: colors[0], alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: height * 0.7, height: height * 0.7, borderRadius: height, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: height * 0.5, height: height * 0.5, borderRadius: height, backgroundColor: colors[1] }} />
      </View>
    </View>
  );
}

/** Add button, search, filters and the recipe cards. Used by Home and the Recipes screen. */
export function RecipeList({ open, onPick }) {
  const { state, t, recipes, toggleLike } = useStore();
  const lang = state.lang;
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const list = recipes.filter(r => (filter === 'all' || r.tags.includes(filter)) && (!q || pick(r.name, lang).toLowerCase().includes(q.toLowerCase())));
  return (
    <>
      {onPick ? null : <Button kind="secondary" icon="plus" label={t('addRecipe')} onPress={() => open('add')} />}
      <Field placeholder={t('search')} value={q} onChangeText={setQ} returnKeyType="search" />
      <Row gap={6} style={{ flexWrap: 'wrap' }}>
        <Pill label={t('all')} active={filter === 'all'} onPress={() => setFilter('all')} />
        {TAG_KEYS.map(k => <Pill key={k} label={t('tag_' + k)} active={filter === k} onPress={() => setFilter(k)} />)}
      </Row>
      {!list.length ? <T c="muted">{t('noMatch')}</T> : null}
      {list.map(r => (
        <Pressable key={r.id} onPress={() => (onPick ? onPick(r.id) : open('recipe', { id: r.id }))}>
          <Card style={{ gap: 12, paddingTop: 12 }}>
            <PhotoSlider photos={r.photos} height={PICTURE} radius={18} empty={<Plate height={PICTURE} />} />
            <Row gap={16}>
              <Pressable onPress={() => toggleLike(likeKey(r))} hitSlop={8} accessibilityRole="button" accessibilityState={{ selected: !!state.liked[likeKey(r)] }} accessibilityLabel={t('like')}>
                <Row gap={6}>
                  <Icon name="heart" c={state.liked[likeKey(r)] ? 'kids' : 'ink'} size={24} w={state.liked[likeKey(r)] ? 2.4 : 1.9} />
                  <T v="bodyStrong">{num(state.liked[likeKey(r)] ? 1 : 0, lang)}</T>
                </Row>
              </Pressable>
              <Pressable onPress={() => open('comments', { id: r.id })} hitSlop={8} accessibilityRole="button" accessibilityLabel={t('commentsTitle')}>
                <Row gap={6}>
                  <Icon name="chat" size={24} />
                  <T v="bodyStrong">{num((state.recipeComments[r.id] || []).length, lang)}</T>
                </Row>
              </Pressable>
            </Row>
            <T v="title" numberOfLines={2}>{pick(r.name, lang)}{r.custom ? `  · ${t('mine')}` : ''}</T>
            <T v="caption" c="muted">{r.time} {t('min')} · {hasPrice(r) ? t('perServing', { c: money(cost(r, state.servings) / state.servings, lang) }) : t('unknownCost')}</T>
            {describe(r, lang) ? <T c="muted" numberOfLines={2}>{describe(r, lang)}</T> : null}
            <Row gap={6} style={{ flexWrap: 'wrap' }}>{r.tags.map(k => <Tag key={k} k={k} />)}</Row>
          </Card>
        </Pressable>
      ))}
    </>
  );
}

/** Chooses a recipe for one day of a week. */
export function PickRecipe({ week, day, back }) {
  const { state, t, setDay } = useStore();
  return (
    <Screen header={<Row style={{ justifyContent: 'flex-end' }}><RoundButton icon="close" label={t('close')} onPress={back} /></Row>}>
      <T v="display">{t('pickFor', { d: dayName(day, state.lang) })}</T>
      <RecipeList onPick={id => { setDay(day, id, week); back(); }} />
    </Screen>
  );
}

export default function Recipes({ open }) {
  const { t } = useStore();
  return (
    <Screen>
      <Header title={t('tab_recipes')} />
      <RecipeList open={open} />
    </Screen>
  );
}
