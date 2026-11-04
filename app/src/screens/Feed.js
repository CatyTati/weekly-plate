// Feed: the newest recipes from people you follow. CopyWeekSheet is also used on profiles.
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store';
import { useNav } from '../nav';
import { dayName, keyToDate, num, pick, thisSunday, timeAgo, weekKey, weekRangeLabel } from '../logic';
import { color, font } from '../theme';
import { Avatar, Button, Card, CopiedNote, Header, Icon, Pill, Row, Screen, T, Tag } from '../components/ui';
import PhotoSlider from '../components/PhotoSlider';
import FoodArt from '../components/FoodArt';
import { feedOf } from '../social';
import { ReactionBar, useReactions } from '../components/Reactions';
import { SourceInfo } from './AddToWeek';

/**
 * Asks which week to copy someone's week into, and says what will change.
 * `theirs` holds their recipes, which are copied into yours.
 */
export function CopyWeekSheet({ cook, theirs, nameOf, onClose }) {
  const { state, t, rtl, byId, copyWeekFrom } = useStore();
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
          <Button label={t('copyDo')} onPress={() => { copyWeekFrom(cook.plan, theirs, chosen); onClose(); showWeek(chosen); }} />
          <Pressable onPress={onClose} hitSlop={8} style={{ alignSelf: 'center' }}><T v="bodyStrong" c="muted">{t('cancel')}</T></Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/** A recipe someone you follow posted: who and when, a big photo, and quick actions. */
function Post({ r, reactions }) {
  const { state, t, copyRecipe } = useStore();
  const { open } = useNav();
  const hours = r.created ? (Date.now() - new Date(r.created).getTime()) / 36e5 : 0;
  const name = r.ownerName || t('noName');
  const copied = state.custom.some(x => x.copiedFrom === r.cloud);
  const openRecipe = () => open('recipe', { recipe: r, canCopy: true });
  return (
    <Card style={{ padding: 0, gap: 0, overflow: 'hidden' }}>
      <Pressable onPress={() => open('profile', { id: r.owner })} accessibilityRole="button" accessibilityLabel={name}>
        <Row gap={10} style={{ padding: 12 }}>
          <Avatar letter={name[0]} size={38} ring />
          <View style={{ flex: 1 }}>
            <T v="bodyStrong" numberOfLines={1}>{name}</T>
            {r.created ? <T v="caption" c="muted">{timeAgo(hours, t)}</T> : null}
          </View>
        </Row>
      </Pressable>
      <Pressable onPress={openRecipe} accessibilityRole="button" accessibilityLabel={r.name}>
        <View>
          <PhotoSlider photos={r.photos} height={280} radius={0} empty={<FoodArt height={280} radius={0} />} />
          <Row gap={5} style={{ position: 'absolute', top: 12, start: 12, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Icon name="clock" c="#fff" size={13} />
            <T v="label" c="#fff" style={{ fontFamily: font.medium }}>{r.time} {t('min')}</T>
          </Row>
        </View>
      </Pressable>
      <View style={{ padding: 14, gap: 8 }}>
        <Row gap={12}>
          <ReactionBar recipeId={r.cloud} recipeName={r.name} owner={r.owner} reactions={reactions.of(r.cloud)} onToggle={reactions.toggle} size={24} />
          <View style={{ flex: 1 }} />
          {r.copiedFromMe ? <CopiedNote recipe={r} />
            : copied ? <Row gap={4}><Icon name="check" c="muted" size={14} /><T v="label" c="muted">{t('copiedRecipe')}</T></Row>
            : <Pill label={t('copyRecipe')} active c="onAccent" soft="accent" onPress={() => copyRecipe(r)} />}
        </Row>
        <Pressable onPress={openRecipe} style={{ gap: 6 }}>
          <T v="title" numberOfLines={2}>{r.name}</T>
          {r.desc ? <T c="muted" numberOfLines={2}>{pick(r.desc, state.lang)}</T> : null}
          {r.tags.length ? <Row gap={6} style={{ flexWrap: 'wrap' }}>{r.tags.map(k => <Tag key={k} k={k} />)}</Row> : null}
        </Pressable>
      </View>
    </Card>
  );
}

/** The people you follow, as a row of round faces. */
function Cooks({ cooks }) {
  const { t } = useStore();
  const { open, go } = useNav();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -22 }} contentContainerStyle={{ gap: 14, paddingHorizontal: 22, paddingVertical: 2 }}>
      {cooks.map(c => (
        <Pressable key={c.id} onPress={() => open('profile', { id: c.id })} accessibilityRole="button" accessibilityLabel={c.name || t('noName')} style={{ alignItems: 'center', gap: 6, width: 64 }}>
          <Avatar letter={(c.name || '?')[0]} size={54} ring />
          <T v="label" center numberOfLines={1}>{c.name || t('noName')}</T>
        </Pressable>
      ))}
      <Pressable onPress={() => go('community')} accessibilityRole="button" accessibilityLabel={t('findCooks')} style={{ alignItems: 'center', gap: 6, width: 64 }}>
        <View style={{ width: 59, height: 59, borderRadius: 30, backgroundColor: color.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="plus" c="accent" />
        </View>
        <T v="label" c="muted" center numberOfLines={1}>{t('moreCooks')}</T>
      </Pressable>
    </ScrollView>
  );
}

/** Newest recipes from people you follow. Pull down to load again. */
export default function Feed() {
  const { user, t } = useStore();
  const { go } = useNav();
  const [feed, setFeed] = useState(null); // { posts, cooks }
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const reactions = useReactions((feed?.posts || []).map(r => r.cloud));
  const load = useCallback(() => {
    setFailed(false);
    return feedOf(user?.id).then(setFeed).catch(() => setFailed(true));
  }, [user?.id]);
  useEffect(() => { load(); }, [load]);
  const refresh = () => { setRefreshing(true); reactions.reload(); load().finally(() => setRefreshing(false)); };

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={color.accent} />}>
      <Header title={t('feed')} sub={t('feedSub')} />
      {failed ? <T c="error">{t('eNetwork')}</T> : null}
      {!feed && !failed ? <ActivityIndicator color={color.accent} /> : null}
      {feed?.cooks.length ? <Cooks cooks={feed.cooks} /> : null}
      {feed && !feed.posts.length ? (
        <Card style={{ padding: 0, overflow: 'hidden', gap: 0 }}>
          <FoodArt height={160} radius={0} />
          <View style={{ padding: 18, gap: 12, alignItems: 'center' }}>
            <T c="muted" center>{t('feedEmpty')}</T>
            <Button label={t('findCooks')} onPress={() => go('community')} />
          </View>
        </Card>
      ) : null}
      {(feed?.posts || []).map(r => <Post key={r.id} r={r} reactions={reactions} />)}
    </Screen>
  );
}
