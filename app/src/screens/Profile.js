// Someone's profile: their recipes for everyone, their weeks for approved followers.
// Copying a recipe or a week needs an approved follow.
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, View, useWindowDimensions } from 'react-native';
import { useStore } from '../store';
import { useNav } from '../nav';
import { getProfile, recipesOf, weeksOf } from '../social';
import { dayName, keyToDate, num, pick, weekKey, weekRangeLabel } from '../logic';
import { color, font } from '../theme';
import { Avatar, Button, Card, CopiedNote, Icon, Row, RoundButton, Screen, T } from '../components/ui';
import { followLabel, useFollowing } from './People';
import { CopyWeekSheet } from './Feed';
import FoodArt from '../components/FoodArt';

const GAP = 10;

/** A recipe as a square photo tile, with its name and prep time on top. */
function Tile({ r, size, onPress }) {
  const { t } = useStore();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={r.name} style={{ width: size }}>
      <View style={{ width: size, height: size, borderRadius: 18, overflow: 'hidden', backgroundColor: color.plate }}>
        {r.photos[0] ? <Image source={{ uri: r.photos[0] }} style={{ width: size, height: size }} /> : <FoodArt height={size} radius={0} />}
        <View style={{ position: 'absolute', start: 0, end: 0, bottom: 0, padding: 10, paddingTop: 24, backgroundColor: 'rgba(0,0,0,0.42)' }}>
          <T v="bodyStrong" c="#fff" numberOfLines={2}>{r.name}</T>
          <Row gap={4}>
            <Icon name="clock" c="#fff" size={12} />
            <T v="label" c="#fff">{r.time} {t('min')}</T>
          </Row>
        </View>
        {r.photos.length > 1 ? (
          <View style={{ position: 'absolute', top: 8, end: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 99, paddingHorizontal: 7, paddingVertical: 2 }}>
            <T v="label" c="#fff">{r.photos.length}</T>
          </View>
        ) : null}
      </View>
      {r.copiedFromMe ? <View style={{ marginTop: 6 }}><CopiedNote recipe={r} /></View> : null}
    </Pressable>
  );
}

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
  const { width } = useWindowDimensions();
  const tile = Math.floor((width - 44 - GAP) / 2); // two per row inside the page padding
  const status = statusOf(id);
  const approved = status === 'approved';

  const load = useCallback(() => {
    setFailed(false);
    Promise.all([getProfile(id), recipesOf(id, me)])
      .then(([p, rs]) => { setProfile(p); setRecipes(rs.map(r => ({ ...r, ownerName: p.name }))); })
      .catch(() => setFailed(true));
  }, [id, me]);
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
          <Row gap={12}>
            <Avatar letter={name[0]} size={60} ring />
            <View style={{ flex: 1, gap: 4 }}>
              <Row gap={6}>
                <T v="title" numberOfLines={1} style={{ flexShrink: 1 }}>{name}</T>
                {profile.isPrivate ? <Icon name="lock" c="muted" size={14} /> : null}
              </Row>
              <Row gap={12}>
                <Row gap={4}><Icon name="book" c="muted" size={14} /><T v="caption" c="muted">{num(recipes ? recipes.length : 0, lang)} {t('statRecipes')}</T></Row>
                <Row gap={4}><Icon name="users" c="muted" size={14} /><T v="caption" c="muted">{num(profile.followers, lang)} {t('statFollowers')}</T></Row>
              </Row>
            </View>
            {busy === id ? <ActivityIndicator color={color.accent} /> : (
              <Pressable onPress={() => toggle({ id }).then(() => getProfile(id).then(setProfile))} accessibilityRole="button"
                style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 5, height: 36, paddingHorizontal: 14, borderRadius: 18,
                  backgroundColor: status ? color.accentSoft : color.accent, opacity: pressed ? 0.85 : 1 })}>
                <Icon name={status ? 'check' : 'plus'} c={status ? 'accent' : 'onAccent'} size={15} />
                <T v="label" c={status ? 'accent' : 'onAccent'} style={{ fontFamily: font.medium }}>{followLabel(status, t)}</T>
              </Pressable>
            )}
          </Row>

          {lock ? (
            <Row gap={10} style={{ backgroundColor: color.accentSoft, borderRadius: 16, padding: 12, alignItems: 'flex-start' }}>
              <Icon name="lock" c="accent" size={18} />
              <T v="caption" c="accent" style={{ flex: 1 }}>{lock}</T>
            </Row>
          ) : null}

          {approved && weeks.length ? (
            <View style={{ gap: 10 }}>
              <Row gap={8}><Icon name="week" c="accent" size={18} /><T v="heading">{t('theirWeeks')}</T></Row>
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
            </View>
          ) : null}

          <Row gap={8}><Icon name="book" c="accent" size={18} /><T v="heading">{t('theirRecipes')}</T></Row>
          {recipes && !recipes.length ? <T c="muted">{t('noTheirRecipes')}</T> : null}
          <Row gap={GAP} style={{ flexWrap: 'wrap', alignItems: 'flex-start' }}>
            {(recipes || []).map(r => <Tile key={r.id} r={r} size={tile} onPress={() => open('recipe', { recipe: r, canCopy: approved })} />)}
          </Row>
        </>
      )}
      {copying ? (
        <CopyWeekSheet cook={{ id, name, plan: copying.plan }} theirs={recipes || []} nameOf={nameOf} onClose={() => setCopying(null)} />
      ) : null}
    </Screen>
  );
}
