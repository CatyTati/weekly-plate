// Home: greeting and my recipes.
import React from 'react';
import { Pressable, View } from 'react-native';
import { useStore } from '../store';
import { useNav } from '../nav';
import { dayName, firstName, greetingKey } from '../logic';
import { color } from '../theme';
import { Avatar, MenuButton, Row, Screen, T } from '../components/ui';
import { RecipeList } from './Recipes';

export default function Home() {
  const { state, user, t, byId, syncFailed } = useStore();
  const { go, open } = useNav();
  const lang = state.lang;
  const now = new Date();
  const today = now.getDay(); // 0 = Sunday, same as the plan
  const name = user?.name || firstName(user);
  const greet = t(greetingKey(now.getHours()), { n: name }).replace(/[,،]\s*$/, '');

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
        <T v="caption" c="muted">{t('homeSub', { d: dayName(today, lang), p: t('people', { n: state.servings }) })}</T>
      </View>

      {syncFailed ? <View style={{ backgroundColor: color.errorSoft, borderRadius: 16, padding: 12 }}><T v="caption" c="error">{t('syncFailed')}</T></View> : null}

      <T v="title">{t('myRecipes')}</T>
      <RecipeList open={open} />
    </Screen>
  );
}
