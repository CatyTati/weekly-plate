// The food database everyone counts calories with. Everyone can read it; new foods people
// suggest wait here until an admin approves them.
import React, { useEffect, useState } from 'react';
import { Pressable, RefreshControl, View } from 'react-native';
import { useStore } from '../store';
import { AISLE_ORDER, aisleName, num } from '../logic';
import { foodName, normalize } from '../nutrition';
import { addersOf, deleteFood, loadFoods, reviewFood, useFoods } from '../foods';
import { color, font } from '../theme';
import { Card, Field, Icon, Pill, Row, RoundButton, Screen, T } from '../components/ui';
import { AddFoodSheet } from '../components/FoodPicker';

/** One food: its names, nutrition per 100 g, and (while waiting) who added it and what to do. */
function FoodRow({ food, adder, actions }) {
  const { state, t } = useStore();
  const lang = state.lang;
  const others = Object.entries(food.names || {}).filter(([l]) => l !== lang).map(([, list]) => list[0]).filter(Boolean);
  const g = v => (v == null ? '–' : `${num(v, lang)} ${t('gramsShort')}`);
  return (
    <Card style={{ gap: 6, paddingVertical: 12 }}>
      <Row gap={10} style={{ alignItems: 'flex-start' }}>
        <View style={{ flex: 1, gap: 2 }}>
          <T v="bodyStrong" numberOfLines={1}>{foodName(food, lang)}</T>
          {others.length ? <T v="label" c="muted" numberOfLines={1}>{others.join(' · ')}</T> : null}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <T v="bodyStrong" c="accent">{num(food.kcal, lang)}</T>
          <T v="label" c="muted">{t('kcalLabel')}</T>
        </View>
      </Row>
      <T v="caption" c="muted">
        {[`${t('proteinLabel')} ${g(food.protein)}`, `${t('carbsLabel')} ${g(food.carbs)}`, `${t('fatLabel')} ${g(food.fat)}`,
          food.piece_g ? t('perPiece', { g: num(food.piece_g, lang) }) : null, aisleName(food.aisle, lang)].filter(Boolean).join(' · ')}
      </T>
      {food.status !== 'approved' ? (
        <Row gap={6} style={{ flexWrap: 'wrap' }}>
          <View style={{ backgroundColor: food.status === 'rejected' ? color.errorSoft : color.accentSoft, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 }}>
            <T v="label" c={food.status === 'rejected' ? 'error' : 'accent'}>{t(food.status === 'rejected' ? 'statusRejected' : 'statusPending')}</T>
          </View>
          {adder ? <T v="label" c="muted">{t('addedBy', { n: adder })}</T> : null}
        </Row>
      ) : null}
      {actions}
    </Card>
  );
}

export default function Foods({ back }) {
  const { state, user, t } = useStore();
  const { foods, admin } = useFoods();
  const me = user?.id;
  const lang = state.lang;
  const [tab, setTab] = useState('approved');
  const [q, setQ] = useState('');
  const [adders, setAdders] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState({});
  const [adding, setAdding] = useState(false);

  useEffect(() => { loadFoods(me, true).catch(() => setError(t('eNetwork'))); }, [me]);
  const waiting = foods.filter(f => f.status !== 'approved' && (admin ? f.status === 'pending' : f.created_by === me));
  const waitingIds = waiting.map(f => f.created_by).join(',');
  useEffect(() => { if (waitingIds) addersOf(waitingIds.split(',')).then(setAdders); }, [waitingIds]);

  const refresh = () => { setRefreshing(true); setError(''); loadFoods(me, true).catch(() => setError(t('eNetwork'))).finally(() => setRefreshing(false)); };
  const act = p => { setError(''); p.catch(() => setError(t('eNetwork'))); };

  const n = normalize(q);
  const shown = (tab === 'approved' ? foods.filter(f => f.status === 'approved') : waiting)
    .filter(f => !n || Object.values(f.names || {}).flat().some(x => normalize(x).includes(n)))
    .sort((a, b) => foodName(a, lang).localeCompare(foodName(b, lang), lang));
  const approvedCount = foods.filter(f => f.status === 'approved').length;

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={color.accent} />}>
      <Row gap={12}>
        <RoundButton icon="back" flip label={t('back')} onPress={back} />
        <View style={{ flex: 1 }}>
          <T v="heading">{t('foodsTitle')}</T>
          <T v="caption" c="muted">{t('foodsSub')}</T>
        </View>
        {admin ? <RoundButton icon="plus" label={t('addFoodBtn')} onPress={() => setAdding(true)} /> : null}
      </Row>
      {adding ? <AddFoodSheet name="" onClose={() => setAdding(false)} onAdded={() => setAdding(false)} /> : null}
      <Row gap={6}>
        <Pill label={`${t('tabApproved')} · ${num(approvedCount, lang)}`} active={tab === 'approved'} onPress={() => setTab('approved')} />
        <Pill label={`${t(admin ? 'tabPending' : 'tabMine')} · ${num(waiting.length, lang)}`} active={tab === 'waiting'} onPress={() => setTab('waiting')} />
      </Row>
      <View>
        <Field placeholder={t('searchFoods')} value={q} onChangeText={setQ} returnKeyType="search" inputStyle={{ paddingStart: 42 }} />
        <View pointerEvents="none" style={{ position: 'absolute', start: 14, top: 0, bottom: 0, justifyContent: 'center' }}>
          <Icon name="search" c="muted" size={18} />
        </View>
      </View>
      {error ? <T c="error">{error}</T> : null}
      {!shown.length ? <T c="muted" center>{tab === 'approved' || q ? t('noFoods') : t(admin ? 'noPending' : 'noMine')}</T> : null}
      {tab === 'approved' ? AISLE_ORDER.map(aisle => {
        const list = shown.filter(f => f.aisle === aisle);
        if (!list.length) return null;
        const expanded = !!n || open[aisle];
        return (
          <View key={aisle} style={{ gap: 8 }}>
            <Pressable onPress={() => setOpen(o => ({ ...o, [aisle]: !o[aisle] }))} accessibilityRole="button" accessibilityState={{ expanded }}
              style={({ pressed }) => ({ backgroundColor: color.surface, borderRadius: 14, borderWidth: 1, borderColor: color.edge, paddingHorizontal: 16, paddingVertical: 14, opacity: pressed ? 0.85 : 1 })}>
              <Row gap={10}>
                <T v="bodyStrong" style={{ flex: 1 }}>{aisleName(aisle, lang)}</T>
                <T v="label" c="muted">{num(list.length, lang)}</T>
                <View style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}><Icon name="down" c="muted" size={18} /></View>
              </Row>
            </Pressable>
            {expanded ? list.map(food => <FoodRow key={food.id} food={food} />) : null}
          </View>
        );
      }) : shown.map(food => (
        <FoodRow key={food.id} food={food} adder={adders[food.created_by]} actions={
          food.status === 'approved' ? null : admin ? (
            <Row gap={8} style={{ marginTop: 4 }}>
              <Pressable onPress={() => act(reviewFood(food.id, 'approved'))} accessibilityRole="button"
                style={({ pressed }) => ({ flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 12, backgroundColor: color.accent, opacity: pressed ? 0.85 : 1 })}>
                <T v="bodyStrong" c="onAccent" style={{ fontFamily: font.medium }}>{t('approve')}</T>
              </Pressable>
              <Pressable onPress={() => act(reviewFood(food.id, 'rejected'))} accessibilityRole="button"
                style={({ pressed }) => ({ flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 12, backgroundColor: color.errorSoft, opacity: pressed ? 0.85 : 1 })}>
                <T v="bodyStrong" c="error" style={{ fontFamily: font.medium }}>{t('reject')}</T>
              </Pressable>
            </Row>
          ) : (
            <Pressable onPress={() => act(deleteFood(food.id))} accessibilityRole="button" hitSlop={6} style={{ alignSelf: 'flex-start' }}>
              <T v="label" c="error" style={{ fontFamily: font.medium }}>{t('deleteFood')}</T>
            </Pressable>
          )
        } />
      ))}
    </Screen>
  );
}
