// Likes and comments on recipes, kept in Supabase so everyone sees the same.
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store';
import { useNav } from '../nav';
import { likersOf, reactionsOf, setLike } from '../social';
import { num } from '../logic';
import { color } from '../theme';
import { Avatar, Icon, Row, T } from './ui';

const NONE = { likes: 0, comments: 0, liked: false };

/** Like and comment counts for these recipe ids (database ids), and a way to like. */
export function useReactions(ids) {
  const { user } = useStore();
  const me = user?.id;
  const key = ids.filter(Boolean).join(',');
  const [map, setMap] = useState({});
  const load = useCallback(() => {
    reactionsOf(key ? key.split(',') : [], me).then(setMap).catch(() => {});
  }, [key, me]);
  useEffect(load, [load]);
  const toggle = id => {
    const cur = map[id] || NONE;
    const on = !cur.liked;
    setMap(m => ({ ...m, [id]: { ...cur, liked: on, likes: cur.likes + (on ? 1 : -1) } }));
    setLike(id, me, on).catch(load); // put it back if it didn't save
  };
  return { of: id => map[id] || NONE, toggle, reload: load };
}

/** Everyone who liked a recipe. Tapping a name opens their profile. */
function Likers({ recipeId, onClose }) {
  const { t, rtl } = useStore();
  const { open } = useNav();
  const insets = useSafeAreaInsets();
  const [people, setPeople] = useState(null);
  useEffect(() => { likersOf(recipeId).then(setPeople).catch(() => setPeople([])); }, [recipeId]);
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', direction: rtl ? 'rtl' : 'ltr' }}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.35)' }]} accessibilityLabel={t('close')} onPress={onClose} />
        <View style={{ backgroundColor: color.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '70%', paddingTop: 18, paddingBottom: insets.bottom + 12 }}>
          <Row gap={8} style={{ paddingHorizontal: 22, paddingBottom: 8 }}>
            <Icon name="heart" c="accent" size={18} filled />
            <T v="heading">{t('likedBy')}</T>
          </Row>
          {!people ? <ActivityIndicator color={color.accent} style={{ margin: 20 }} /> : null}
          {people && !people.length ? <T c="muted" style={{ paddingHorizontal: 22, paddingVertical: 12 }}>{t('noLikes')}</T> : null}
          <ScrollView contentContainerStyle={{ paddingHorizontal: 22 }}>
            {(people || []).map(p => (
              <Pressable key={p.id} onPress={() => { onClose(); open('profile', { id: p.id }); }} accessibilityRole="button">
                <Row gap={12} style={{ paddingVertical: 10 }}>
                  <Avatar letter={(p.name || '?')[0]} size={36} />
                  <T style={{ flex: 1 }}>{p.name || t('noName')}</T>
                </Row>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Heart and comment counts for one recipe. The heart likes; the number beside it shows who liked;
 * the speech bubble opens the comments.
 */
export function ReactionBar({ recipeId, recipeName, owner, reactions, onToggle, size = 22 }) {
  const { state, t } = useStore();
  const { open } = useNav();
  const [showLikers, setShowLikers] = useState(false);
  if (!recipeId) return null; // not saved to the database yet
  const r = reactions;
  return (
    <Row gap={14}>
      <Row gap={4}>
        <Pressable onPress={() => onToggle(recipeId)} hitSlop={8} accessibilityRole="button" accessibilityState={{ selected: r.liked }} accessibilityLabel={t('like')}>
          <Icon name="heart" c={r.liked ? 'accent' : 'ink'} size={size} filled={r.liked} />
        </Pressable>
        <Pressable onPress={() => setShowLikers(true)} hitSlop={8} accessibilityRole="button" accessibilityLabel={t('likedBy')}>
          <T v="bodyStrong">{num(r.likes, state.lang)}</T>
        </Pressable>
      </Row>
      <Pressable onPress={() => open('comments', { recipeId, name: recipeName, owner })} hitSlop={8} accessibilityRole="button" accessibilityLabel={t('commentsTitle')}>
        <Row gap={4}>
          <Icon name="chat" size={size} />
          <T v="bodyStrong">{num(r.comments, state.lang)}</T>
        </Row>
      </Pressable>
      {showLikers ? <Likers recipeId={recipeId} onClose={() => setShowLikers(false)} /> : null}
    </Row>
  );
}
