// Feed: the newest recipes from people you follow. CopyWeekSheet is also used on profiles.
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store';
import { useNav } from '../nav';
import { dayName, keyToDate, num, pick, thisSunday, timeAgo, weekKey, weekRangeLabel } from '../logic';
import { color } from '../theme';
import { Avatar, Button, Card, CopiedNote, Header, Icon, Row, Screen, T, Tag } from '../components/ui';
import PhotoSlider from '../components/PhotoSlider';
import FoodArt from '../components/FoodArt';
import { feedOf } from '../social';
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

function Post({ r }) {
  const { state, t } = useStore();
  const { open } = useNav();
  const hours = r.created ? (Date.now() - new Date(r.created).getTime()) / 36e5 : 0;
  const name = r.ownerName || t('noName');
  return (
    <Card style={{ gap: 10 }}>
      <Pressable onPress={() => open('profile', { id: r.owner })} accessibilityRole="button" accessibilityLabel={name}>
        <Row gap={10}>
          <Avatar letter={name[0]} size={36} />
          <View style={{ flex: 1 }}>
            <T v="bodyStrong" numberOfLines={1}>{name}</T>
            {r.created ? <T v="caption" c="muted">{timeAgo(hours, t)}</T> : null}
          </View>
        </Row>
      </Pressable>
      <Pressable onPress={() => open('recipe', { recipe: r, canCopy: true })} accessibilityRole="button" accessibilityLabel={r.name} style={{ gap: 8 }}>
        <PhotoSlider photos={r.photos} height={200} radius={18} empty={<FoodArt height={200} radius={18} />} />
        <T v="title" numberOfLines={2}>{r.name}</T>
        <CopiedNote recipe={r} />
        <Row gap={6}>
          <Icon name="clock" c="muted" size={16} />
          <T v="caption" c="muted">{r.time} {t('min')}</T>
        </Row>
        {r.desc ? <T c="muted" numberOfLines={2}>{pick(r.desc, state.lang)}</T> : null}
        {r.tags.length ? <Row gap={6} style={{ flexWrap: 'wrap' }}>{r.tags.map(k => <Tag key={k} k={k} />)}</Row> : null}
      </Pressable>
    </Card>
  );
}

/** Newest recipes from people you follow. Pull down to load again. */
export default function Feed() {
  const { user, t } = useStore();
  const { go } = useNav();
  const [posts, setPosts] = useState(null);
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(() => {
    setFailed(false);
    return feedOf(user?.id).then(setPosts).catch(() => setFailed(true));
  }, [user?.id]);
  useEffect(() => { load(); }, [load]);
  const refresh = () => { setRefreshing(true); load().finally(() => setRefreshing(false)); };

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={color.accent} />}>
      <Header title={t('feed')} sub={t('feedSub')} />
      {failed ? <T c="error">{t('eNetwork')}</T> : null}
      {!posts && !failed ? <ActivityIndicator color={color.accent} /> : null}
      {posts && !posts.length ? (
        <Card style={{ alignItems: 'center', gap: 12 }}>
          <T c="muted" center>{t('feedEmpty')}</T>
          <Button label={t('findCooks')} onPress={() => go('community')} />
        </Card>
      ) : null}
      {(posts || []).map(r => <Post key={r.id} r={r} />)}
    </Screen>
  );
}
