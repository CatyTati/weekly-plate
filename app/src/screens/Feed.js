// Feed: posts from cooks you follow, newest first, like Instagram.
import React, { useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store';
import { useNav } from '../nav';
import { COOKS, cost, dayName, feedFor, keyToDate, money, num, pick, thisSunday, timeAgo, weekKey, weekRangeLabel } from '../logic';
import { color, tagColor } from '../theme';
import { Avatar, Button, Card, Icon, MenuButton, Pill, Row, RoundButton, T, Tag, s as ui } from '../components/ui';
import { Stories } from './Home';
import AddToWeekSheet, { SourceInfo } from './AddToWeek';

/**
 * Asks which week to copy someone's week into, and says what will change.
 * For a real user, `theirs` holds their recipes, which are copied into yours.
 */
export function CopyWeekSheet({ cook, theirs, nameOf, onClose }) {
  const { state, t, rtl, byId, copyPlan, copyWeekFrom } = useStore();
  const { showWeek } = useNav();
  const insets = useSafeAreaInsets();
  const lang = state.lang;
  const today = new Date().getDay();
  const weeks = [0, 1, 2, 3].map(i => {
    const start = thisSunday(); start.setDate(start.getDate() + 7 * i);
    return { i, key: weekKey(start) };
  });
  const [chosen, setChosen] = useState(weeks[1].key);
  const name = pick(cook.name, lang);
  const weekName = i => (i === 0 ? t('thisWeek') : i === 1 ? t('nextWeek') : t('inWeeks', { n: num(i, lang) }));
  const replaced = (key, i) => (state.weeks[key] || []).filter((id, d) => id && (i > 0 || d >= today)).length;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', direction: rtl ? 'rtl' : 'ltr' }}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(58,51,64,0.28)' }]} accessibilityLabel={t('close')} onPress={onClose} />
        <View style={{ backgroundColor: color.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '88%', marginTop: insets.top }}>
          <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 22 + insets.bottom, gap: 14 }}>
          <T v="title">{t('copyTitle', { n: name })}</T>
          <SourceInfo cook={cook} whole />
          <T c="muted">{t('copyExplain', { n: name })}</T>
          <Card style={{ gap: 6, paddingVertical: 12 }}>
            {cook.plan.map((id, d) => (id ? (
              <Row key={d} gap={10}>
                <T v="label" c="accent" style={{ minWidth: 64 }}>{dayName(d, lang)}</T>
                <T v="caption" style={{ flex: 1 }} numberOfLines={1}>{nameOf ? nameOf(id) : pick(byId(id)?.name, lang)}</T>
              </Row>
            ) : null))}
          </Card>
          <T v="bodyStrong">{t('copyWhich')}</T>
          <View style={{ gap: 8 }}>
            {weeks.map(({ i, key }) => {
              const on = key === chosen;
              const n = replaced(key, i);
              return (
                <Pressable key={key} onPress={() => setChosen(key)} accessibilityRole="radio" accessibilityState={{ checked: on }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, borderWidth: 2, borderColor: on ? color.accent : color.line, backgroundColor: on ? color.accentSoft : color.surface }}>
                  <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: on ? color.accent : color.line, alignItems: 'center', justifyContent: 'center' }}>
                    {on ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color.accent }} /> : null}
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <T v="bodyStrong">{weekName(i)} · {weekRangeLabel(keyToDate(key), lang)}</T>
                    <T v="caption" c={n ? 'error' : 'muted'}>
                      {[i === 0 ? t('copyFromToday') : null, n ? t('copyReplaces', { n: num(n, lang) }) : t('copyEmpty')].filter(Boolean).join(' · ')}
                    </T>
                  </View>
                </Pressable>
              );
            })}
          </View>
          <Button label={t('copyDo')} onPress={() => { if (theirs) copyWeekFrom(cook.plan, theirs, chosen); else copyPlan(cook.id, chosen); onClose(); showWeek(chosen); }} />
          <Pressable onPress={onClose} hitSlop={8} style={{ alignSelf: 'center' }}><T v="bodyStrong" c="muted">{t('cancel')}</T></Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Post({ post }) {
  const { state, t, byId, toggleLike, toggleSave } = useStore();
  const { open, go } = useNav();
  const [picking, setPicking] = useState(false);
  const [copying, setCopying] = useState(false);
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
          ? <Pill label={t('copyWeekBtn')} active c="accent" soft="accentSoft" onPress={() => setCopying(true)} />
          : <Pill label={t('addToWeek')} active c="accent" soft="accentSoft" onPress={() => setPicking(true)} />}
      </Row>

      {copying ? <CopyWeekSheet cook={cook} onClose={() => setCopying(false)} /> : null}

      {picking && recipe ? <AddToWeekSheet id={recipe.id} cook={cook} onClose={() => setPicking(false)} /> : null}

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
