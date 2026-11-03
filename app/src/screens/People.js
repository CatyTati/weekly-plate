// Followers, following, follow requests, and finding people to follow.
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useStore } from '../store';
import { useNav } from '../nav';
import { isDemo } from '../auth';
import { approveFollower, follow, listPeople, myConnections, removeFollower, unfollow } from '../social';
import { num } from '../logic';
import { color } from '../theme';
import { Avatar, Card, Field, Pill, Row, RoundButton, Screen, T } from '../components/ui';

const LABEL = { followers: 'followers_tab', followingTab: 'followingTab', requests: 'requestsTab', findPeople: 'findPeople' };

/** The follow button's text: following, request sent, or follow. */
export function followLabel(status, t, followBack) {
  if (status === 'approved') return t('following');
  if (status === 'pending') return t('requested');
  return followBack ? t('followBack') : t('follow');
}

/** One person. Tapping the row opens their profile; `right` replaces the follow button. */
export function PersonRow({ person, status, busy, onToggle, followBack, right }) {
  const { t } = useStore();
  const { open } = useNav();
  const name = person.name || t('noName');
  return (
    <Pressable onPress={() => open?.('profile', { id: person.id })} accessibilityRole="button" accessibilityLabel={name}>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }}>
        <Avatar letter={name[0]} size={40} />
        <View style={{ flex: 1 }}><T v="bodyStrong" numberOfLines={1}>{name}</T></View>
        {right || (busy ? <ActivityIndicator color={color.accent} />
          : <Pill label={followLabel(status, t, followBack)} active={!status} c="onAccent" soft="accent" onPress={onToggle} />)}
      </Card>
    </Pressable>
  );
}

/** Your follows, and ways to change them. */
export function useFollowing(me) {
  const [lists, setLists] = useState(null); // { followers, requests, following }
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(null); // id being changed
  const load = useCallback(() => {
    setError(false);
    myConnections(me).then(setLists).catch(() => setError(true));
  }, [me]);
  useEffect(load, [load]);
  const statusOf = id => (lists?.following || []).find(p => p.id === id)?.status;
  const run = async (id, fn) => {
    setBusy(id); setError(false);
    try { await fn(); load(); } catch { setError(true); } finally { setBusy(null); }
  };
  const toggle = p => run(p.id, () => (statusOf(p.id) ? unfollow(me, p.id) : follow(me, p.id)));
  const approve = p => run(p.id, () => approveFollower(me, p.id));
  const decline = p => run(p.id, () => removeFollower(me, p.id));
  return { lists, error, setError, busy, statusOf, toggle, approve, decline, reload: load };
}

export default function People({ tab: startTab = 'followers', back }) {
  const { state, user, t } = useStore();
  const lang = state.lang;
  const me = user?.id;
  const [tab, setTab] = useState(startTab);
  const [query, setQuery] = useState('');
  const [found, setFound] = useState([]);
  const { lists, error, setError, busy, statusOf, toggle, approve, decline } = useFollowing(me);

  useEffect(() => {
    if (tab !== 'findPeople') return undefined;
    const timer = setTimeout(() => listPeople(me, query).then(setFound).catch(() => setError(true)), 300);
    return () => clearTimeout(timer);
  }, [tab, query, me, setError]);

  const tabs = ['followers', 'followingTab', ...(lists?.requests.length || tab === 'requests' ? ['requests'] : []), 'findPeople'];
  const people = { followers: lists?.followers, followingTab: lists?.following, requests: lists?.requests, findPeople: found }[tab];
  const empty = { followers: t('noFollowers'), followingTab: t('noFollowing'), requests: t('noRequests'), findPeople: t('noPeople') }[tab];
  const count = k => {
    const list = { followers: lists?.followers, followingTab: lists?.following, requests: lists?.requests }[k];
    return list ? ` · ${num(list.length, lang)}` : '';
  };

  return (
    <Screen header={<Row style={{ justifyContent: 'flex-end' }}><RoundButton icon="close" label={t('close')} onPress={back} /></Row>}>
      <T v="display">{t('people_title')}</T>
      <Row gap={6} style={{ flexWrap: 'wrap' }}>
        {tabs.map(k => <Pill key={k} label={t(LABEL[k]) + count(k)} active={tab === k} onPress={() => setTab(k)} />)}
      </Row>

      {isDemo ? <T c="muted">{t('peopleDemo')}</T> : null}
      {error ? <T c="error">{t('eNetwork')}</T> : null}
      {tab === 'findPeople' ? <Field placeholder={t('searchPeople')} value={query} autoCapitalize="none" autoCorrect={false} onChangeText={setQuery} /> : null}

      {!lists && !error && !isDemo ? <ActivityIndicator color={color.accent} /> : null}
      {people && !people.length ? <T c="muted" center>{empty}</T> : null}
      {(people || []).map(p => (
        <PersonRow key={p.id} person={p} status={statusOf(p.id)} busy={busy === p.id} followBack={tab === 'followers'} onToggle={() => toggle(p)}
          right={tab !== 'requests' ? null : busy === p.id ? <ActivityIndicator color={color.accent} /> : (
            <Row gap={6}>
              <Pill label={t('approve')} active c="onAccent" soft="accent" onPress={() => approve(p)} />
              <Pill label={t('decline')} onPress={() => decline(p)} />
            </Row>
          )} />
      ))}
    </Screen>
  );
}
