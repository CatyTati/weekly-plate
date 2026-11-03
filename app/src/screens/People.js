// Followers, following, and finding people to follow.
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useStore } from '../store';
import { isDemo } from '../auth';
import { follow, listPeople, myConnections, unfollow } from '../social';
import { num } from '../logic';
import { color } from '../theme';
import { Avatar, Card, Field, Pill, Row, RoundButton, Screen, T } from '../components/ui';

const TABS = ['followers', 'followingTab', 'findPeople'];

/** One person with a follow button. */
export function PersonRow({ person, following, busy, onToggle, followBack }) {
  const { t } = useStore();
  const name = person.name || t('noName');
  return (
    <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }}>
      <Avatar letter={name[0]} size={40} />
      <View style={{ flex: 1 }}><T v="bodyStrong" numberOfLines={1}>{name}</T></View>
      {busy ? <ActivityIndicator color={color.accent} />
        : <Pill label={following ? t('following') : followBack ? t('followBack') : t('follow')} active={!following} c="onAccent" soft="accent" onPress={onToggle} />}
    </Card>
  );
}

/** Who I follow, and a way to follow or unfollow someone. */
export function useFollowing(me) {
  const [lists, setLists] = useState(null); // { followers, following }
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(null); // id being followed or unfollowed
  const load = useCallback(() => {
    setError(false);
    myConnections(me).then(setLists).catch(() => setError(true));
  }, [me]);
  useEffect(load, [load]);
  const followingIds = new Set((lists?.following || []).map(p => p.id));
  const toggle = async p => {
    setBusy(p.id); setError(false);
    try {
      if (followingIds.has(p.id)) await unfollow(me, p.id); else await follow(me, p.id);
      load();
    } catch { setError(true); } finally { setBusy(null); }
  };
  return { lists, error, setError, busy, followingIds, toggle };
}
const LABEL = { followers: 'followers_tab', followingTab: 'followingTab', findPeople: 'findPeople' };

export default function People({ tab: startTab = 'followers', back }) {
  const { state, user, t } = useStore();
  const lang = state.lang;
  const me = user?.id;
  const [tab, setTab] = useState(startTab);
  const [query, setQuery] = useState('');
  const [found, setFound] = useState([]);
  const { lists, error, setError, busy, followingIds, toggle } = useFollowing(me);

  useEffect(() => {
    if (tab !== 'findPeople') return undefined;
    const timer = setTimeout(() => listPeople(me, query).then(setFound).catch(() => setError(true)), 300);
    return () => clearTimeout(timer);
  }, [tab, query, me]);

  const people = tab === 'followers' ? lists?.followers : tab === 'followingTab' ? lists?.following : found;
  const empty = tab === 'followers' ? t('noFollowers') : tab === 'followingTab' ? t('noFollowing') : t('noPeople');
  const count = k => (lists ? ` · ${num(lists[k === 'followingTab' ? 'following' : 'followers'].length, lang)}` : '');

  return (
    <Screen header={<Row style={{ justifyContent: 'flex-end' }}><RoundButton icon="close" label={t('close')} onPress={back} /></Row>}>
      <T v="display">{t('people_title')}</T>
      <Row gap={6} style={{ flexWrap: 'wrap' }}>
        {TABS.map(k => <Pill key={k} label={t(LABEL[k]) + (k === 'findPeople' ? '' : count(k))} active={tab === k} onPress={() => setTab(k)} />)}
      </Row>

      {isDemo ? <T c="muted">{t('peopleDemo')}</T> : null}
      {error ? <T c="error">{t('eNetwork')}</T> : null}
      {tab === 'findPeople' ? <Field placeholder={t('searchPeople')} value={query} autoCapitalize="none" autoCorrect={false} onChangeText={setQuery} /> : null}

      {!lists && !error && !isDemo ? <ActivityIndicator color={color.accent} /> : null}
      {people && !people.length ? <T c="muted" center>{empty}</T> : null}
      {(people || []).map(p => (
        <PersonRow key={p.id} person={p} following={followingIds.has(p.id)} busy={busy === p.id} followBack={tab === 'followers'} onToggle={() => toggle(p)} />
      ))}
    </Screen>
  );
}
