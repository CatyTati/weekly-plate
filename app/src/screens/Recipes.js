import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store';
import { MEALS, TAG_KEYS, cost, dayName, hasPrice, mealsOf, money, num, pick } from '../logic';
import { color, font } from '../theme';
import { Button, Card, CopiedNote, Field, Header, Icon, Pill, Row, RoundButton, Screen, T, Tag } from '../components/ui';
import PhotoSlider from '../components/PhotoSlider';
import FoodArt from '../components/FoodArt';
import { ReactionBar, useReactions } from '../components/Reactions';

const PICTURE = 200; // same as the feed

/** Every filter in one place: the meal (one of them, or all) and who it suits. */
function FilterSheet({ meal, setMeal, tag, setTag, count, onClose }) {
  const { state, t, rtl } = useStore();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', direction: rtl ? 'rtl' : 'ltr' }}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.35)' }]} accessibilityLabel={t('close')} onPress={onClose} />
        <View style={{ backgroundColor: color.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, paddingBottom: 22 + insets.bottom, gap: 16 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <T v="title">{t('filterTitle')}</T>
            {meal !== 'all' || tag !== 'all' ? (
              <Pressable onPress={() => { setMeal('all'); setTag('all'); }} hitSlop={8} accessibilityRole="button">
                <T v="bodyStrong" c="accent">{t('clearFilters')}</T>
              </Pressable>
            ) : null}
          </Row>
          <View style={{ gap: 8 }}>
            <T v="label" c="muted">{t('mealLabel')}</T>
            <Row gap={6} style={{ flexWrap: 'wrap' }}>
              <Pill label={t('allMeals')} active={meal === 'all'} onPress={() => setMeal('all')} />
              {MEALS.map(m => <Pill key={m} label={t('meal_' + m)} active={meal === m} onPress={() => setMeal(m)} />)}
            </Row>
          </View>
          <View style={{ gap: 8 }}>
            <T v="label" c="muted">{t('fTags')}</T>
            <Row gap={6} style={{ flexWrap: 'wrap' }}>
              <Pill label={t('all')} active={tag === 'all'} onPress={() => setTag('all')} />
              {TAG_KEYS.map(k => <Pill key={k} label={t('tag_' + k)} active={tag === k} onPress={() => setTag(k)} />)}
            </Row>
          </View>
          <Button label={t('showN', { n: num(count, state.lang) })} onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}
const describe = (r, lang) => pick(r.desc, lang);

/** Add button, search, filters and the recipe cards. Used by Home and the Recipes screen. */
export function RecipeList({ open, onPick, showAdd = true, meal: firstMeal = 'all' }) {
  const { state, user, t, recipes } = useStore();
  const lang = state.lang;
  const [filter, setFilter] = useState('all');
  const [meal, setMeal] = useState(firstMeal);
  const [filtering, setFiltering] = useState(false);
  const active = [meal !== 'all' && t('meal_' + meal), filter !== 'all' && t('tag_' + filter)].filter(Boolean);
  const [q, setQ] = useState('');
  const reactions = useReactions(onPick ? [] : recipes.map(r => r.cloud));
  // Newest first: recipes are kept in the order they were added.
  const list = [...recipes].reverse().filter(r => (meal === 'all' || mealsOf(r).includes(meal)) && (filter === 'all' || r.tags.includes(filter))
    && (!q || pick(r.name, lang).toLowerCase().includes(q.toLowerCase())));
  return (
    <>
      {onPick || !showAdd ? null : <Button kind="secondary" icon="plus" label={t('addRecipe')} onPress={() => open('add')} />}
      <Row gap={8} style={{ alignItems: 'stretch' }}>
        <View style={{ flex: 1 }}>
          <Field placeholder={t('search')} value={q} onChangeText={setQ} returnKeyType="search" inputStyle={{ paddingStart: 42 }} />
          <View pointerEvents="none" style={{ position: 'absolute', start: 14, top: 0, bottom: 0, justifyContent: 'center' }}>
            <Icon name="search" c="muted" size={18} />
          </View>
        </View>
        {/* All filters behind one button; a number on it says how many are on. */}
        <Pressable onPress={() => setFiltering(true)} accessibilityRole="button" accessibilityLabel={t('filterTitle')}
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, borderRadius: 16,
            borderWidth: 1.5, borderColor: color.accent, backgroundColor: active.length ? color.accentSoft : color.surface, opacity: pressed ? 0.8 : 1 })}>
          <Icon name="filter" c="accent" size={18} />
          <T v="label" c="accent" style={{ fontFamily: font.medium }}>{t('filterBtn')}</T>
          {active.length ? (
            <View style={{ minWidth: 18, height: 18, borderRadius: 9, backgroundColor: color.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
              <T v="label" c="onAccent">{num(active.length, lang)}</T>
            </View>
          ) : null}
        </Pressable>
      </Row>
      {active.length ? (
        <Row gap={8} style={{ flexWrap: 'wrap' }}>
          <T v="caption" c="muted">{active.join(' · ')}</T>
          <Pressable onPress={() => { setMeal('all'); setFilter('all'); }} hitSlop={8} accessibilityRole="button">
            <T v="caption" c="accent" style={{ fontFamily: font.medium }}>{t('clearFilters')}</T>
          </Pressable>
        </Row>
      ) : null}
      {filtering ? <FilterSheet meal={meal} setMeal={setMeal} tag={filter} setTag={setFilter} count={list.length} onClose={() => setFiltering(false)} /> : null}
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
              <ReactionBar recipeId={r.cloud} recipeName={pick(r.name, lang)} owner={user?.id} reactions={reactions.of(r.cloud)} onToggle={reactions.toggle} size={20} />
            </Row>
          </Card>
        </Pressable>
      ))}
    </>
  );
}

/** Chooses a recipe for one meal of a day. Tapping one opens it; it's added from there. */
export function PickRecipe({ week, day, meal = 'dinner', open, back }) {
  const { state, t } = useStore();
  return (
    <Screen header={<Row style={{ justifyContent: 'flex-end' }}><RoundButton icon="close" label={t('close')} onPress={back} /></Row>}>
      <T v="display">{meal === 'dinner' ? t('pickFor', { d: dayName(day, state.lang) }) : t('pickMealFor', { m: t('meal_' + meal), d: dayName(day, state.lang) })}</T>
      <RecipeList meal={meal} onPick={id => open('recipe', { id, pickFor: { week, day, meal } })} />
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
