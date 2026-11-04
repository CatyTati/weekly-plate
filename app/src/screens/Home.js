// Home: greeting, tonight's dinner, the week at a glance and my recipes.
import React from 'react';
import { Image, Pressable, View } from 'react-native';
import { useStore } from '../store';
import { useNav } from '../nav';
import { dayName, firstName, greetingKey, num, pick, weekKey } from '../logic';
import { color, font } from '../theme';
import { Avatar, Card, Icon, MenuButton, Row, RoundButton, Screen, T } from '../components/ui';
import FoodArt from '../components/FoodArt';
import { RecipeList } from './Recipes';

/** Tonight's dinner, or a nudge to choose one. */
function Tonight({ recipe, onOpen, onPick }) {
  const { state, t } = useStore();
  if (!recipe) {
    return (
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{ width: 84, height: 84, borderRadius: 20, overflow: 'hidden' }}><FoodArt height={84} radius={20} /></View>
        <View style={{ flex: 1, gap: 6 }}>
          <T v="heading">{t('tonightEmpty')}</T>
          <T v="caption" c="muted">{t('tonightHint')}</T>
          <Pressable onPress={onPick} hitSlop={6} accessibilityRole="button" style={{ alignSelf: 'flex-start' }}>
            <Row gap={6}><Icon name="plus" c="accent" size={16} /><T v="bodyStrong" c="accent">{t('tonightPick')}</T></Row>
          </Pressable>
        </View>
      </Card>
    );
  }
  return (
    <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel={`${t('tonight')}: ${pick(recipe.name, state.lang)}`}>
      <Card style={{ padding: 0, overflow: 'hidden', gap: 0 }}>
        <View>
          {recipe.photos?.[0] ? <Image source={{ uri: recipe.photos[0] }} style={{ width: '100%', height: 190 }} resizeMode="cover" /> : <FoodArt height={190} radius={0} />}
          <View style={{ position: 'absolute', top: 12, start: 12, backgroundColor: color.accent, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5 }}>
            <T v="label" c="onAccent" style={{ fontFamily: font.medium }}>{t('tonight')}</T>
          </View>
        </View>
        <View style={{ padding: 16, gap: 6 }}>
          <T v="title" numberOfLines={2}>{pick(recipe.name, state.lang)}</T>
          <Row gap={6}><Icon name="clock" c="muted" size={16} /><T v="caption" c="muted">{recipe.time} {t('min')}</T></Row>
        </View>
      </Card>
    </Pressable>
  );
}

/** The week at a glance: a dot for each day, filled when a dinner is planned. */
function WeekStrip({ plan, today, onPress }) {
  const { state, t } = useStore();
  const planned = plan.filter(Boolean).length;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={t('planned', { n: planned })}>
      <Card style={{ gap: 10, paddingVertical: 14 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <T v="bodyStrong">{t('yourWeek')}</T>
          <T v="caption" c="muted">{t('planned', { n: num(planned, state.lang) })}</T>
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          {[0, 1, 2, 3, 4, 5, 6].map(d => {
            const on = !!plan[d];
            const isToday = d === today;
            return (
              <View key={d} style={{ alignItems: 'center', gap: 4 }}>
                <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: on ? color.accent : color.bg, borderWidth: isToday ? 2 : 0, borderColor: color.accent }}>
                  {on ? <Icon name="check" c="onAccent" size={16} w={2.6} /> : null}
                </View>
                <T v="label" c={isToday ? 'accent' : 'muted'} style={isToday ? { fontFamily: font.medium } : null}>{state.lang === 'he' ? 'אבגדהוש'[d] : dayName(d, state.lang).slice(0, 2)}</T>
              </View>
            );
          })}
        </Row>
      </Card>
    </Pressable>
  );
}

export default function Home() {
  const { state, user, t, byId, recipes, syncFailed } = useStore();
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

      <Tonight recipe={byId(state.plan[today])} onOpen={() => open('recipe', { id: state.plan[today] })}
        onPick={() => open('pick', { week: weekKey(), day: today })} />
      <WeekStrip plan={state.plan} today={today} onPress={() => go('week')} />

      <Row gap={10} style={{ marginTop: 6 }}>
        <T v="title" style={{ flex: 1 }}>{t('myRecipes')} <T v="title" c="muted">· {num(recipes.length, lang)}</T></T>
        <RoundButton icon="plus" bg="accent" c="onAccent" size={40} label={t('addRecipe')} onPress={() => open('add')} />
      </Row>
      <RecipeList open={open} showAdd={false} />
    </Screen>
  );
}
