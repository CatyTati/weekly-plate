// Search: other people's dishes at random until you type, then the dishes whose name matches
// (or is close) and the people whose name does, in one field. A private account's dish shows
// only its photo and cook until your follow request is approved.
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, RefreshControl, View, useWindowDimensions } from 'react-native';
import { useStore } from '../store';
import { useNav } from '../nav';
import { explore, listPeople, recipeById } from '../social';
import { num } from '../logic';
import { color } from '../theme';
import { ConfirmDialog, Field, Icon, Row, RoundButton, Screen, T } from '../components/ui';
import FoodArt from '../components/FoodArt';
import { PersonRow, followLabel, useFollowing } from './People';

const GAP = 10;

/** A dish as a square photo: its name and time when you may open it, a lock and its cook when not. */
function DishTile({ d, size, onPress }) {
  const { state, t } = useStore();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={d.locked ? t('lockedDish', { n: d.ownerName }) : d.name}
      style={({ pressed }) => ({ width: size, height: size, borderRadius: 18, overflow: 'hidden', backgroundColor: color.plate, opacity: pressed ? 0.85 : 1 })}>
      {d.photo ? <Image source={{ uri: d.photo }} style={{ width: size, height: size }} /> : <FoodArt height={size} radius={0} />}
      <View style={{ position: 'absolute', start: 0, end: 0, bottom: 0, padding: 10, paddingTop: 24, backgroundColor: 'rgba(0,0,0,0.42)', gap: 2 }}>
        {d.locked ? (
          <Row gap={5}>
            <Icon name="lock" c="#fff" size={13} />
            <T v="label" c="#fff" numberOfLines={1} style={{ flex: 1 }}>{d.ownerName}</T>
          </Row>
        ) : (
          <>
            <T v="bodyStrong" c="#fff" numberOfLines={2}>{d.name}</T>
            <T v="label" c="#fff" numberOfLines={1}>{d.ownerName}{d.time ? ` · ${num(d.time, state.lang)} ${t('min')}` : ''}</T>
          </>
        )}
      </View>
    </Pressable>
  );
}

export default function Search({ back }) {
  const { user, t } = useStore();
  const { open } = useNav();
  const me = user?.id;
  const { busy, statusOf, toggle } = useFollowing(me);
  const [q, setQ] = useState('');
  const [dishes, setDishes] = useState(null);
  const [people, setPeople] = useState([]);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [locked, setLocked] = useState(null); // a private dish that was tapped
  const [opening, setOpening] = useState(null);
  const { width } = useWindowDimensions();
  const tile = Math.floor((width - 44 - GAP) / 2);
  const asked = useRef(0);

  const search = text => {
    const n = ++asked.current; // only the latest search may show its answer
    setError(false);
    return Promise.all([explore(text), text.trim() ? listPeople(me, text) : Promise.resolve([])])
      .then(([d, p]) => { if (n === asked.current) { setDishes(d); setPeople(p.slice(0, 5)); } })
      .catch(() => { if (n === asked.current) setError(true); });
  };
  // Wait for a pause in typing before searching.
  useEffect(() => {
    const timer = setTimeout(() => search(q), q ? 300 : 0);
    return () => clearTimeout(timer);
  }, [q]);

  const refresh = () => { setRefreshing(true); search(q).finally(() => setRefreshing(false)); };
  const openDish = d => {
    if (d.locked) { setLocked(d); return; }
    setOpening(d.id);
    recipeById(d.id, d.ownerName)
      .then(recipe => open('recipe', { recipe, canCopy: statusOf(d.owner) === 'approved' }))
      .catch(() => setError(true))
      .finally(() => setOpening(null));
  };
  const lockedStatus = locked ? statusOf(locked.owner) : null;

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={color.accent} />}>
      <Row gap={12}>
        <RoundButton icon="back" flip label={t('back')} onPress={back} />
        <T v="heading" style={{ flex: 1 }}>{t('searchTitle')}</T>
      </Row>
      <View>
        <Field placeholder={t('searchAll')} value={q} onChangeText={setQ} autoCorrect={false} returnKeyType="search" inputStyle={{ paddingStart: 42 }} />
        <View pointerEvents="none" style={{ position: 'absolute', start: 14, top: 0, bottom: 0, justifyContent: 'center' }}>
          <Icon name="search" c="muted" size={18} />
        </View>
      </View>
      {error ? <T c="error">{t('eNetwork')}</T> : null}

      {people.length ? (
        <View style={{ gap: 8 }}>
          <T v="label" c="muted">{t('peopleFound')}</T>
          {people.map(p => <PersonRow key={p.id} person={p} status={statusOf(p.id)} busy={busy === p.id} onToggle={() => toggle(p)} />)}
        </View>
      ) : null}

      {q.trim() && dishes ? <T v="label" c="muted">{dishes.length ? t('dishesFound') : t('noDishesFound')}</T> : !q.trim() ? <T v="label" c="muted">{t('dishesRandom')}</T> : null}
      {!dishes ? <ActivityIndicator color={color.accent} /> : (
        <Row gap={GAP} style={{ flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {dishes.map(d => (
            <View key={d.id}>
              <DishTile d={d} size={tile} onPress={() => openDish(d)} />
              {opening === d.id ? <ActivityIndicator color="#fff" style={{ position: 'absolute', top: 12, end: 12 }} /> : null}
            </View>
          ))}
        </Row>
      )}

      {locked ? (
        <ConfirmDialog
          title={t('lockedTitle', { n: locked.ownerName })}
          message={t(lockedStatus === 'pending' ? 'lockPending' : 'lockedBody')}
          confirmLabel={lockedStatus ? t('seeProfile') : followLabel(null, t)}
          onCancel={() => setLocked(null)}
          onConfirm={() => {
            const d = locked;
            setLocked(null);
            if (lockedStatus) open('profile', { id: d.owner });
            else toggle({ id: d.owner });
          }} />
      ) : null}
    </Screen>
  );
}
