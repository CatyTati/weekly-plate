// Someone's profile: their recipes for everyone, their weeks for approved followers.
// Copying a recipe or a week needs an approved follow.
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useStore } from '../store';
import { useNav } from '../nav';
import { getProfile, recipesOf, weeksOf } from '../social';
import { dayName, keyToDate, num, pick, weekKey, weekRangeLabel } from '../logic';
import { color } from '../theme';
import { Avatar, Button, Card, Pill, Row, RoundButton, Screen, T, Tag } from '../components/ui';
import { followLabel, useFollowing } from './People';
import { CopyWeekSheet } from './Feed';

export default function Profile({ id, back }) {
  const { state, user, t, byId } = useStore();
  const { open } = useNav();
  const lang = state.lang;
  const me = user?.id;
  const { busy, statusOf, toggle, error } = useFollowing(me);
  const [profile, setProfile] = useState(null);
  const [recipes, setRecipes] = useState(null);
  const [weeks, setWeeks] = useState([]);
  const [copying, setCopying] = useState(null); // a week being copied
  const [failed, setFailed] = useState(false);
  const status = statusOf(id);
  const approved = status === 'approved';

  const load = useCallback(() => {
    setFailed(false);
    Promise.all([getProfile(id), recipesOf(id)])
      .then(([p, rs]) => { setProfile(p); setRecipes(rs.map(r => ({ ...r, ownerName: p.name }))); })
      .catch(() => setFailed(true));
  }, [id]);
  useEffect(load, [load]);
  useEffect(() => {
    if (!approved) { setWeeks([]); return; }
    weeksOf(id, weekKey()).then(setWeeks).catch(() => setFailed(true));
  }, [id, approved]);

  const name = profile?.name || t('noName');
  const nameOf = rid => pick((recipes || []).find(r => r.id === rid)?.name || byId(rid)?.name, lang);
  const lock = status === 'pending' ? t('lockPending') : !approved ? (profile?.isPrivate ? t('lockPrivate') : t('lockFollow')) : null;

  return (
    <Screen header={<Row style={{ justifyContent: 'flex-end' }}><RoundButton icon="close" label={t('close')} onPress={back} /></Row>}>
      {failed || error ? <T c="error">{t('eNetwork')}</T> : null}
      {!profile ? <ActivityIndicator color={color.accent} /> : (
        <>
          <Row gap={14}>
            <Avatar letter={name[0]} size={64} />
            <View style={{ flex: 1, gap: 2 }}>
              <T v="title" numberOfLines={1}>{name}</T>
              <T v="caption" c="muted">{t('followers', { n: num(profile.followers, lang) })}{profile.isPrivate ? ` · ${t('privateBadge')}` : ''}</T>
            </View>
          </Row>
          {busy === id ? <ActivityIndicator color={color.accent} />
            : <Button kind={status ? 'secondary' : 'primary'} label={followLabel(status, t)} onPress={() => toggle({ id }).then(() => getProfile(id).then(setProfile))} />}
          {lock ? <View style={{ backgroundColor: color.accentSoft, borderRadius: 16, padding: 12 }}><T v="caption" c="accent">{lock}</T></View> : null}

          {approved ? (
            <>
              <T v="heading">{t('theirWeeks')}</T>
              {!weeks.length ? <T c="muted">{t('noWeeks')}</T> : null}
              {weeks.map(w => (
                <Card key={w.key} style={{ gap: 6 }}>
                  <T v="bodyStrong">{weekRangeLabel(keyToDate(w.key), lang)}</T>
                  {w.plan.map((rid, d) => (rid ? (
                    <Row key={d} gap={10}>
                      <T v="label" c="accent" style={{ minWidth: 64 }}>{dayName(d, lang)}</T>
                      <T v="caption" style={{ flex: 1 }} numberOfLines={1}>{nameOf(rid)}</T>
                    </Row>
                  ) : null))}
                  <Button kind="secondary" label={t('copyWeekBtn')} onPress={() => setCopying(w)} />
                </Card>
              ))}
            </>
          ) : null}

          <T v="heading">{t('theirRecipes')}</T>
          {recipes && !recipes.length ? <T c="muted">{t('noTheirRecipes')}</T> : null}
          {(recipes || []).map(r => (
            <Pressable key={r.id} onPress={() => open('recipe', { recipe: r, canCopy: approved })}>
              <Card style={{ gap: 6 }}>
                <T v="bodyStrong">{r.name}</T>
                <T v="caption" c="muted">{r.time} {t('min')}</T>
                {r.desc ? <T c="muted" numberOfLines={2}>{r.desc}</T> : null}
                <Row gap={6} style={{ flexWrap: 'wrap' }}>{r.tags.map(k => <Tag key={k} k={k} />)}</Row>
              </Card>
            </Pressable>
          ))}
        </>
      )}
      {copying ? (
        <CopyWeekSheet cook={{ id, name, plan: copying.plan }} theirs={recipes || []} nameOf={nameOf} onClose={() => setCopying(null)} />
      ) : null}
    </Screen>
  );
}
