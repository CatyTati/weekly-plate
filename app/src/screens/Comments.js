// Comments on a recipe. Saved on the phone until the backend serves them.
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { useStore } from '../store';
import { firstName, pick } from '../logic';
import { Avatar, Button, Field, Row, RoundButton, Screen, T } from '../components/ui';

export default function Comments({ id, back }) {
  const { state, user, t, byId, addComment } = useStore();
  const [text, setText] = useState('');
  const recipe = byId(id);
  const list = state.recipeComments[id] || [];

  const send = () => {
    const body = text.trim();
    if (!body) return;
    addComment(id, { id: String(Date.now()), name: user?.name || firstName(user), text: body });
    setText('');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen footer={
        <Row gap={10} style={{ alignItems: 'flex-start' }}>
          <Field style={{ flex: 1 }} placeholder={t('addComment')} value={text} maxLength={500} returnKeyType="send" onChangeText={setText} onSubmitEditing={send} />
          <Button label={t('send')} onPress={send} />
        </Row>
      }>
        <Row gap={12}>
          <RoundButton icon="back" flip label={t('back')} onPress={back} />
          <View style={{ flex: 1 }}>
            <T v="heading">{t('commentsTitle')}</T>
            <T v="caption" c="muted" numberOfLines={1}>{pick(recipe?.name, state.lang)}</T>
          </View>
        </Row>
        {!list.length ? <T c="muted" center>{t('noComments')}</T> : null}
        {list.map(c => (
          <Row key={c.id} gap={10} style={{ alignItems: 'flex-start' }}>
            <Avatar letter={c.name[0]} size={36} />
            <View style={{ flex: 1, gap: 2 }}>
              <T v="bodyStrong">{c.name}</T>
              <T>{c.text}</T>
            </View>
          </Row>
        ))}
      </Screen>
    </KeyboardAvoidingView>
  );
}
