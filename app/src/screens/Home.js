// Home: greeting, cooks you follow (stories), tonight's dinner, week at a glance, shortcuts.
import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useStore } from '../store';
import { useNav } from '../nav';
import { COOKS, cost, dayName, firstName, greetingKey, money, pick, prepPlan, shoppingList, num } from '../logic';
import { color, radius, tagColor } from '../theme';
import { Avatar, Button, Card, Icon, MenuButton, Row, Screen, T, Tag } from '../components/ui';

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

function Plate({ height = 130, colors = ['#F6E3DA', '#E59A86'] }) {
  return (
    <View style={{ height, borderRadius: 18, backgroundColor: colors[0], alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: height * 0.7, height: height * 0.7, borderRadius: height, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: height * 0.5, height: height * 0.5, borderRadius: height, backgroundColor: colors[1] }} />
      </View>
    </View>
  );
}

export default function Home() {
  const { state, user, t, byId } = useStore();
  const { go, open, showFeedOf } = useNav();
  const lang = state.lang;
  const now = new Date();
  const today = now.getDay(); // 0 = Sunday, same as the plan
  const dishes = state.plan.map(byId);
  const tonight = dishes[today];
  const spent = dishes.filter(Boolean).reduce((s, r) => s + cost(r, state.servings), 0);
  const items = shoppingList(dishes.filter(Boolean), state.servings);
  const left = items.filter(i => !state.checked[i.key]).length;
  const prep = prepPlan(dishes.filter(Boolean), state.servings);
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

      {show.stories ? <Stories onCook={id => showFeedOf(id)} onMore={() => go('community')} /> : null}

      {show.tonight ? (
        <Card style={{ gap: 12, paddingTop: 12 }}>
          {tonight?.photos?.[0] ? null : <Plate />}
          <Row style={{ justifyContent: 'space-between' }}>
            <T v="label" c="accent">{t('tonight')}</T>
            <Row gap={6}>{(tonight?.tags || []).slice(0, 2).map(k => <Tag key={k} k={k} />)}</Row>
          </Row>
          {tonight ? <>
            <T v="title">{pick(tonight.name, lang)}</T>
            <T v="caption" c="muted">{tonight.time} {t('min')} · {money(cost(tonight, state.servings), lang)}{tonight.kid ? ` · ${t('forKids')} ${pick(tonight.kid, lang)}` : ''}</T>
            <Button kind="secondary" label={t('viewRecipe')} onPress={() => open('recipe', { id: tonight.id, day: today })} />
          </> : <Button kind="secondary" label={t('planTonight')} onPress={() => go('week')} />}
        </Card>
      ) : null}

      {show.week ? (
        <View style={{ gap: 8 }}>
          <T v="label" c="muted">{t('weekGlance')}</T>
          <Row gap={6}>
            {[0, 1, 2, 3, 4, 5, 6].map(d => {
              const on = d === today;
              return (
                <Pressable key={d} onPress={() => go('week')} accessibilityRole="button" accessibilityLabel={dayName(d, lang)}
                  style={{ flex: 1, alignItems: 'center', gap: 4, paddingVertical: 10, borderRadius: 16, backgroundColor: on ? color.accent : color.surface }}>
                  <T v="label" c={on ? 'onAccent' : 'ink'} center numberOfLines={1}>{dayName(d, lang).slice(0, lang === 'he' ? 1 : 2)}</T>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: dishes[d] ? (on ? color.onAccent : color.accent) : color.line }} />
                </Pressable>
              );
            })}
          </Row>
        </View>
      ) : null}

      {show.shortcuts ? (
        <Row gap={10} style={{ alignItems: 'stretch' }}>
          <Pressable style={{ flex: 1 }} onPress={() => open('prep')}>
            <Card style={{ gap: 6 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: color.accentSoft, alignItems: 'center', justifyContent: 'center' }}><Icon name="pot" c="accent" size={18} /></View>
              <T v="bodyStrong">{t('tab_prep')}</T>
              <T v="caption" c="muted">{t('prepInfo', { n: num(prep.recipes.length, lang), h: num(prep.hours, lang) })}</T>
            </Card>
          </Pressable>
          <Pressable style={{ flex: 1 }} onPress={() => go('shop')}>
            <Card style={{ gap: 6 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: color.budgetSoft, alignItems: 'center', justifyContent: 'center' }}><Icon name="shop" c="budget" size={18} /></View>
              <T v="bodyStrong">{t('tab_shop')}</T>
              <T v="caption" c="muted">{t('shopLeft', { n: num(left, lang) })}</T>
            </Card>
          </Pressable>
        </Row>
      ) : null}
    </Screen>
  );
}

export { Plate };
