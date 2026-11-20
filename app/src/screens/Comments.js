// Comments on a recipe, kept in Supabase so everyone who can see the recipe sees them.
// You can delete your own comments; the recipe's cook can delete any of them.
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useStore } from '../store';
import { useNav } from '../nav';
import { addComment, commentsOf, deleteComment } from '../social';
import { timeAgo } from '../logic';
import { color } from '../theme';
import { Avatar, Button, Field, Icon, Row, RoundButton, Screen, T } from '../components/ui';

export default function Comments({ recipeId, name, owner, back }) {
  const { user, t } = useStore();
  const { open } = useNav();
  const me = user?.id;
  const [list, setList] = useState(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const load = useCallback(() => {
    setFailed(false);
    return commentsOf(recipeId).then(setList).catch(() => setFailed(true));
  }, [recipeId]);
  useEffect(() => { load(); }, [load]);

  const send = () => {
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    addComment(recipeId, me, body)
      .then(() => { setText(''); return load(); })
      .catch(() => setFailed(true))
      .finally(() => setBusy(false));
  };
  const remove = id => {
    setList(l => l.filter(c => c.id !== id));
    deleteComment(id).catch(load);
  };

  return (
    <Screen footer={
      <Row gap={10} style={{ alignItems: 'flex-start' }}>
        <Field style={{ flex: 1 }} placeholder={t('addComment')} value={text} maxLength={500} returnKeyType="send" onChangeText={setText} onSubmitEditing={send} />
        {busy ? <ActivityIndicator color={color.accent} style={{ marginTop: 14 }} /> : <Button label={t('send')} onPress={send} />}
      </Row>
    }>
      <Row gap={12}>
        <RoundButton icon="back" flip label={t('back')} onPress={back} />
        <View style={{ flex: 1 }}>
          <T v="heading">{t('commentsTitle')}{list ? ` · ${list.length}` : ''}</T>
          {name ? <T v="caption" c="muted" numberOfLines={1}>{name}</T> : null}
        </View>
      </Row>
      {failed ? <T c="error">{t('eNetwork')}</T> : null}
      {!list && !failed ? <ActivityIndicator color={color.accent} /> : null}
      {list && !list.length ? <T c="muted" center>{t('noComments')}</T> : null}
      {(list || []).map(c => {
        const hours = (Date.now() - new Date(c.created).getTime()) / 36e5;
        return (
          <Row key={c.id} gap={10} style={{ alignItems: 'flex-start' }}>
            <Pressable onPress={() => open('profile', { id: c.userId })} accessibilityRole="button" accessibilityLabel={c.name || t('noName')}>
              <Avatar letter={(c.name || '?')[0]} size={36} />
            </Pressable>
            <View style={{ flex: 1, gap: 2, backgroundColor: color.surface, borderRadius: 16, padding: 10, borderWidth: 1, borderColor: color.edge }}>
              <Row gap={6}>
                <T v="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>{c.name || t('noName')}</T>
                <T v="label" c="muted">{timeAgo(hours, t)}</T>
              </Row>
              <T>{c.body}</T>
            </View>
            {c.userId === me || owner === me ? (
              <RoundButton icon="trash" size={30} bg="bg" c="muted" label={t('deleteComment')} onPress={() => remove(c.id)} />
            ) : null}
          </Row>
        );
      })}
    </Screen>
  );
}
