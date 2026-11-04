import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useStore } from '../store';
import { TAG_KEYS, cost, dayName, hasPrice, money, num, pick } from '../logic';
import { color, font } from '../theme';
import { Button, Card, CopiedNote, Field, Header, Icon, Pill, Row, RoundButton, Screen, T, Tag } from '../components/ui';
import PhotoSlider from '../components/PhotoSlider';
import FoodArt from '../components/FoodArt';

const PICTURE = 200; // same as the feed
const likeKey = r => `recipe:${r.id}`; // feed posts share state.liked
const describe = (r, lang) => pick(r.desc, lang);

/** Add button, search, filters and the recipe cards. Used by Home and the Recipes screen. */
export function RecipeList({ open, onPick, showAdd = true }) {
  const { state, t, recipes, toggleLike } = useStore();
  const lang = state.lang;
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  // Newest first: recipes are kept in the order they were added.
  const list = [...recipes].reverse().filter(r => (filter === 'all' || r.tags.includes(filter)) && (!q || pick(r.name, lang).toLowerCase().includes(q.toLowerCase())));
  return (
    <>
      {onPick || !showAdd ? null : <Button kind="secondary" icon="plus" label={t('addRecipe')} onPress={() => open('add')} />}
      <View>
        <Field placeholder={t('search')} value={q} onChangeText={setQ} returnKeyType="search" inputStyle={{ paddingStart: 42 }} />
        <View pointerEvents="none" style={{ position: 'absolute', start: 14, top: 0, bottom: 0, justifyContent: 'center' }}>
          <Icon name="search" c="muted" size={18} />
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -22 }} contentContainerStyle={{ gap: 6, paddingHorizontal: 22 }}>
        <Pill label={t('all')} active={filter === 'all'} onPress={() => setFilter('all')} />
        {TAG_KEYS.map(k => <Pill key={k} label={t('tag_' + k)} active={filter === k} onPress={() => setFilter(k)} />)}
      </ScrollView>
      {!list.length ? <T c="muted">{t('noMatch')}</T> : null}
      {list.map(r => (
        <Pressable key={r.id} onPress={() => (onPick ? onPick(r.id) : open('recipe', { id: r.id }))}>
          <Card style={{ gap: 10, paddingTop: 12 }}>
            <View>
              <PhotoSlider photos={r.photos} height={PICTURE} radius={18} empty={<FoodArt height={PICTURE} radius={18} />} />
              <Row gap={5} style={{ position: 'absolute', top: 10, start: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Icon name="clock" c="#fff" size={13} />
                <T v="label" c="#fff" style={{ fontFamily: font.medium }}>{r.time} {t('min')}</T>
              </Row>
            </View>
            <T v="title" numberOfLines={2}>{pick(r.name, lang)}</T>
            <CopiedNote recipe={r} />
            {describe(r, lang) ? <T c="muted" numberOfLines={2}>{describe(r, lang)}</T> : null}
            <Row gap={14}>
              <Row gap={6} style={{ flex: 1, flexWrap: 'wrap' }}>{r.tags.map(k => <Tag key={k} k={k} />)}</Row>
              <Pressable onPress={() => toggleLike(likeKey(r))} hitSlop={8} accessibilityRole="button" accessibilityState={{ selected: !!state.liked[likeKey(r)] }} accessibilityLabel={t('like')}>
                <Row gap={6}>
                  <Icon name="heart" c={state.liked[likeKey(r)] ? 'accent' : 'muted'} size={20} filled={!!state.liked[likeKey(r)]} />
                  <T v="caption" c="muted">{num(state.liked[likeKey(r)] ? 1 : 0, lang)}</T>
                </Row>
              </Pressable>
              <Pressable onPress={() => open('comments', { id: r.id })} hitSlop={8} accessibilityRole="button" accessibilityLabel={t('commentsTitle')}>
                <Row gap={6}>
                  <Icon name="chat" c="muted" size={20} />
                  <T v="caption" c="muted">{num((state.recipeComments[r.id] || []).length, lang)}</T>
                </Row>
              </Pressable>
            </Row>
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
