// Home: greeting, cooks you follow (stories) and my recipes.
import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useStore } from '../store';
import { useNav } from '../nav';
import { COOKS, cost, dayName, firstName, greetingKey, money, pick } from '../logic';
import { color, tagColor } from '../theme';
import { Avatar, Icon, MenuButton, Row, Screen, T } from '../components/ui';
import { RecipeList } from './Recipes';

export function Stories({ onCook, onMore, active }) {
  const { state, t } = useStore();
  const cooks = COOKS.filter(c => state.following.includes(c.id));
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingVertical: 4 }} style={{ marginHorizontal: -22 }}>
      <View style={{ width: 8 }} />
      {cooks.map(c => {
        const [fg, bg] = tagColor[c.modes[0]];
        const name = pick(c.name, state.lang);
        return (
          <Pressable key={c.id} onPress={() => onCook(c.id)} accessibilityRole="button" accessibilityLabel={t('postsBy', { n: name })}
            style={{ alignItems: 'center', gap: 6, width: 68, opacity: active && active !== c.id ? 0.5 : 1 }}>
            <Avatar letter={name[0]} fg={fg} bg={bg} size={56} ring />
            <T v="label" center numberOfLines={1}>{name}</T>
          </Pressable>
        );
      })}
      <Pressable onPress={onMore} accessibilityRole="button" style={{ alignItems: 'center', gap: 6, width: 68 }}>
        <View style={{ width: 61, height: 61, borderRadius: 31, backgroundColor: color.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="plus" c="accent" />
        </View>
        <T v="label" c="muted" center numberOfLines={1}>{t('moreCooks')}</T>
      </Pressable>
      <View style={{ width: 8 }} />
    </ScrollView>
  );
}

export default function Home() {
  const { state, user, t, byId, syncFailed } = useStore();
  const { go, open, showFeedOf } = useNav();
  const lang = state.lang;
  const now = new Date();
  const today = now.getDay(); // 0 = Sunday, same as the plan
  const dishes = state.plan.map(byId);
  const spent = dishes.filter(Boolean).reduce((s, r) => s + cost(r, state.servings), 0);
  const name = user?.name || firstName(user);
  const greet = t(greetingKey(now.getHours()), { n: name }).replace(/[,،]\s*$/, '');
  const show = state.homeShows;

  return (
    <Screen>
      <Row gap={12}>
        <MenuButton />
        <View style={{ flex: 1 }} />
        <Pressable onPress={() => go('settings')} accessibilityRole="button" accessibilityLabel={t('settings')}>
          <Avatar letter={name[0]} size={40} />
        </Pressable>
      </Row>
      <View style={{ gap: 2 }}>
        <T v="display">{greet}</T>
        <T v="caption" c="muted">{t('homeSub', { d: dayName(today, lang), p: t('people', { n: state.servings }), b: money(Math.max(0, state.budget - spent), lang) })}</T>
      </View>

      {syncFailed ? <View style={{ backgroundColor: color.errorSoft, borderRadius: 16, padding: 12 }}><T v="caption" c="error">{t('syncFailed')}</T></View> : null}

      {show.stories ? <Stories onCook={id => showFeedOf(id)} onMore={() => go('community')} /> : null}

      <T v="title">{t('myRecipes')}</T>
      <RecipeList open={open} />
    </Screen>
  );
}
