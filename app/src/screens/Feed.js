// Feed: posts from cooks you follow, newest first, like Instagram.
import React, { useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store';
import { useNav } from '../nav';
import { COOKS, cost, dayName, feedFor, money, num, pick, timeAgo } from '../logic';
import { color, tagColor } from '../theme';
import { Avatar, Button, Card, Icon, MenuButton, Pill, Row, RoundButton, T, Tag, s as ui } from '../components/ui';
import { Stories } from './Home';

function Post({ post }) {
  const { state, t, byId, toggleLike, toggleSave, setDay, copyPlan } = useStore();
  const { open, go } = useNav();
  const [picking, setPicking] = useState(false);
  const lang = state.lang;
  const cook = COOKS.find(c => c.id === post.cook);
  const [fg, bg] = tagColor[cook.modes[0]];
  const recipe = post.kind === 'recipe' ? byId(post.recipe) : null;
  const liked = !!state.liked[post.id], saved = !!state.saved[post.id];
  const name = pick(cook.name, lang);

  return (
    <Card style={{ paddingHorizontal: 0, paddingTop: 14, paddingBottom: 16, gap: 12 }}>
      <Row gap={10} style={{ paddingHorizontal: 16 }}>
        <Avatar letter={name[0]} fg={fg} bg={bg} size={40} ring />
        <View style={{ flex: 1 }}>
          <T v="bodyStrong">{name}</T>
          <T v="caption" c="muted">{timeAgo(post.hours, t)}{post.kind === 'week' ? ` · ${t('sharedWeek')}` : ''}</T>
        </View>
      </Row>

      <Pressable onPress={() => (recipe ? open('recipe', { id: recipe.id }) : null)} onLongPress={() => toggleLike(post.id)}
        style={{ height: 260, backgroundColor: post.photo[0], alignItems: 'center', justifyContent: 'center' }}>
        {post.kind === 'week' ? (
          <View style={{ backgroundColor: color.surface, borderRadius: 20, padding: 14, gap: 6, width: '78%' }}>
            {cook.plan.slice(0, 5).map((id, d) => (
              <Row key={d} gap={10}>
                <T v="label" c="accent" style={{ minWidth: 64 }}>{dayName(d, lang)}</T>
                <T v="caption" style={{ flex: 1 }} numberOfLines={1}>{pick(byId(id).name, lang)}</T>
              </Row>
            ))}
          </View>
        ) : (
          <View style={{ width: 176, height: 176, borderRadius: 88, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 126, height: 126, borderRadius: 63, backgroundColor: post.photo[1] }} />
          </View>
        )}
      </Pressable>

      <Row gap={16} style={{ paddingHorizontal: 16 }}>
        <Pressable onPress={() => toggleLike(post.id)} hitSlop={8} accessibilityRole="button" accessibilityState={{ selected: liked }} accessibilityLabel={t('like')}>
          <Icon name="heart" c={liked ? 'kids' : 'ink'} size={24} w={liked ? 2.4 : 1.9} />
        </Pressable>
        <View accessible accessibilityLabel={t('comments', { n: post.comments })}><Icon name="chat" size={24} /></View>
        <Pressable onPress={() => toggleSave(post.id)} hitSlop={8} accessibilityRole="button" accessibilityState={{ selected: saved }} accessibilityLabel={t('save')}>
          <Icon name="save" c={saved ? 'accent' : 'ink'} size={24} w={saved ? 2.4 : 1.9} />
        </Pressable>
        <View style={{ flex: 1 }} />
        {post.kind === 'week'
          ? <Pill label={t('copyPlan')} active c="accent" soft="accentSoft" onPress={() => { copyPlan(cook.id); go('week'); }} />
          : <Pill label={t('addToWeek')} active={!picking} c="accent" soft="accentSoft" onPress={() => setPicking(p => !p)} />}
      </Row>

      {picking && recipe ? (
        <View style={{ paddingHorizontal: 16, gap: 8 }}>
          <T v="label" c="muted">{t('pickDay')}</T>
          <Row gap={6} style={{ flexWrap: 'wrap' }}>
            {[0, 1, 2, 3, 4, 5, 6].map(d => <Pill key={d} label={dayName(d, lang)} onPress={() => { setDay(d, recipe.id); setPicking(false); }} />)}
          </Row>
        </View>
      ) : null}

      <View style={{ paddingHorizontal: 16, gap: 6 }}>
        <T v="bodyStrong">{t('likes', { n: num(post.likes + (liked ? 1 : 0), lang) })} · {t('saves', { n: num(post.saves + (saved ? 1 : 0), lang) })}</T>
        {recipe ? <T v="bodyStrong" c="accent">{pick(recipe.name, lang)} · {recipe.time} {t('min')} · {money(cost(recipe, state.servings), lang)}</T> : null}
        <T>{pick(post.text, lang)}</T>
        {recipe ? <Row gap={6} style={{ flexWrap: 'wrap' }}>{recipe.tags.map(k => <Tag key={k} k={k} />)}</Row> : null}
        <T v="caption" c="muted">{t('comments', { n: num(post.comments, lang) })}</T>
      </View>
    </Card>
  );
}

export default function Feed({ only }) {
  const { state, t } = useStore();
  const { go, showFeedOf } = useNav();
  const posts = feedFor(state.following, only);
  const onlyName = only ? pick(COOKS.find(c => c.id === only).name, state.lang) : null;

  const header = (
    <View style={{ gap: 14, paddingBottom: 4 }}>
      <Row gap={12}>
        <MenuButton />
        <T v="display" style={{ flex: 1 }}>{t('feed')}</T>
        <RoundButton icon="plus" c="accent" bg="accentSoft" label={t('addRecipe')} onPress={() => go('recipes')} />
      </Row>
      <Stories active={only} onCook={id => showFeedOf(id === only ? null : id)} onMore={() => go('community')} />
      {only ? (
        <Row gap={8}>
          <T v="caption" c="muted" style={{ flex: 1 }}>{t('postsBy', { n: onlyName })}</T>
          <Pill label={t('showAll')} onPress={() => showFeedOf(null)} />
        </Row>
      ) : <T v="caption" c="muted">{t('feedFrom')}</T>}
    </View>
  );

  return (
    <View style={ui.screen}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <FlatList
          data={posts}
          keyExtractor={p => p.id}
          renderItem={({ item }) => <Post post={item} />}
          ListHeaderComponent={header}
          ListEmptyComponent={
            <Card style={{ alignItems: 'center', gap: 12 }}>
              <T c="muted" center>{t('feedEmpty')}</T>
              <Button label={t('findCooks')} onPress={() => go('community')} />
            </Card>
          }
          contentContainerStyle={[ui.content, { gap: 16 }]}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </View>
  );
}
