// Linking a recipe ingredient to a food in the database, so its calories are counted:
// suggestions while typing, "did you mean" for typos, and adding a food that isn't there yet.
import React, { useState } from 'react';
import { Keyboard, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store';
import { isDemo } from '../auth';
import { AISLE_ORDER, U, aisleName, num } from '../logic';
import { didYouMean, foodName, matchFood, normalize, suggestFoods } from '../nutrition';
import { suggestFood, useFoods } from '../foods';
import { color, font, shadow } from '../theme';
import { Button, Field, Icon, Pill, Row, T } from './ui';

/** What a row becomes when it's linked to `food`: its name (if you only typed the start), aisle and a fitting unit. */
export function linkRow(row, food, lang) {
  const name = foodName(food, lang);
  const typed = normalize(row.n);
  const unit = row.u !== U ? row.u : food.piece_g && ['veg', 'dairy', 'bread'].includes(food.aisle) ? U : 'גרם';
  return { f: food.id, a: food.aisle, u: unit, n: !typed || normalize(name).startsWith(typed) ? name : row.n };
}

/** Under an ingredient's name: what it's linked to, suggestions while typing, or a way to add it. */
export function FoodHint({ row, focused, onLink }) {
  const { state, t } = useStore();
  const { index, byId } = useFoods();
  const [adding, setAdding] = useState(false);
  const lang = state.lang;
  const text = row.n.trim();
  if (text.length < 2) return null;
  const linked = (row.f && byId.get(row.f)) || (!focused ? matchFood(text, index) : null);
  const pick = food => { Keyboard.dismiss(); onLink(linkRow(row, food, lang)); };
  const sheet = adding ? <AddFoodSheet name={text} onClose={() => setAdding(false)} onAdded={food => { setAdding(false); pick(food); }} /> : null;

  if (linked) {
    return (
      <Row gap={6}>
        <Icon name="check" c="kids" size={14} />
        <T v="label" c="muted" style={{ flex: 1 }} numberOfLines={1}>{t('foodLinked', { n: foodName(linked, lang), k: num(Math.round(linked.kcal), lang) })}</T>
      </Row>
    );
  }
  if (focused) {
    const list = suggestFoods(text, index, lang, 4);
    return (
      <View style={{ borderRadius: 14, backgroundColor: color.accentSoft, ...shadow }}>
      <View style={{ backgroundColor: color.accentSoft, borderRadius: 14, borderWidth: 1.5, borderColor: color.accent, overflow: 'hidden' }}>
        {list.length ? (
          <Row gap={6} style={{ backgroundColor: color.accent, paddingHorizontal: 14, paddingVertical: 7 }}>
            <Icon name="search" c="onAccent" size={14} />
            <T v="label" c="onAccent" style={{ fontFamily: font.medium }}>{t('foodSuggestions')}</T>
          </Row>
        ) : null}
        {list.map(food => (
          <Pressable key={food.id} onPress={() => pick(food)} accessibilityRole="button"
            style={({ pressed }) => ({ paddingHorizontal: 14, paddingVertical: 12, backgroundColor: pressed ? color.surface : 'transparent', borderBottomWidth: 1, borderColor: color.surface })}>
            <Row gap={8}>
              <Icon name="plus" c="accent" size={14} />
              <T v="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>{foodName(food, lang)}</T>
              <T v="label" c="muted">{num(Math.round(food.kcal), lang)} {t('kcalLabel')}</T>
            </Row>
          </Pressable>
        ))}
        {isDemo ? null : (
          <Pressable onPress={() => { Keyboard.dismiss(); setAdding(true); }} accessibilityRole="button"
            style={({ pressed }) => ({ paddingHorizontal: 14, paddingVertical: 10, backgroundColor: pressed ? color.surface : 'transparent' })}>
            <Row gap={8}><Icon name="plus" c="accent" size={16} /><T c="accent" style={{ flex: 1, fontFamily: font.medium }} numberOfLines={1}>{t('addNewFood', { n: text })}</T></Row>
          </Pressable>
        )}
        {sheet}
      </View>
      </View>
    );
  }
  const guess = didYouMean(text, index);
  return (
    <View style={{ gap: 4 }}>
      {guess ? (
        <Pressable onPress={() => pick(guess)} accessibilityRole="button" hitSlop={6}>
          <T v="label" c="accent" style={{ fontFamily: font.medium }}>{t('didYouMean', { n: foodName(guess, lang) })}</T>
        </Pressable>
      ) : null}
      <Row gap={6} style={{ flexWrap: 'wrap' }}>
        <T v="label" c="muted">{t('foodUnknown')}</T>
        {isDemo ? null : (
          <Pressable onPress={() => setAdding(true)} accessibilityRole="button" hitSlop={6}>
            <T v="label" c="accent" style={{ fontFamily: font.medium }}>{t('addNewFood', { n: text })}</T>
          </Pressable>
        )}
      </Row>
      {sheet}
    </View>
  );
}

const decimal = v => v.replace(',', '.').replace(/[^\d.]/g, '');
const optional = v => (String(v).trim() === '' ? null : Number(v));

/** A short form for a food that isn't in the database. It's yours right away and waits for approval. */
export function AddFoodSheet({ name, onClose, onAdded }) {
  const { state, user, t, rtl } = useStore();
  const insets = useSafeAreaInsets();
  const lang = state.lang;
  const [f, setF] = useState({ name, aisle: 'pantry', kcal: '', protein: '', carbs: '', fat: '', piece: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = patch => { setF(x => ({ ...x, ...patch })); setError(''); };

  const save = () => {
    const kcal = Number(f.kcal);
    if (!f.name.trim()) return setError(t('eFoodName'));
    if (f.kcal === '' || !(kcal >= 0 && kcal <= 900)) return setError(t('eKcal'));
    const grams = v => { const n = optional(v); return n == null ? null : Math.min(100, Math.max(0, n)); };
    setBusy(true);
    suggestFood(user.id, {
      names: { [lang]: [f.name.trim()] }, aisle: f.aisle, kcal,
      protein: grams(f.protein), carbs: grams(f.carbs), fat: grams(f.fat),
      piece_g: optional(f.piece) > 0 ? optional(f.piece) : null, density: null,
    }).then(onAdded).catch(() => { setError(t('eNetwork')); setBusy(false); });
  };

  const small = (key, label) => (
    <Field style={{ flex: 1 }} label={label} value={f[key]} keyboardType="decimal-pad" inputStyle={{ textAlign: 'center' }}
      onChangeText={v => set({ [key]: decimal(v) })} />
  );
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', direction: rtl ? 'rtl' : 'ltr' }}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.35)' }]} accessibilityLabel={t('close')} onPress={onClose} />
        <View style={{ backgroundColor: color.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '90%' }}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 22, paddingBottom: 22 + insets.bottom, gap: 14 }}>
            <T v="title">{t('newFoodTitle')}</T>
            <T v="caption" c="muted">{t('newFoodHint')}</T>
            <Field label={t('fFoodName')} value={f.name} maxLength={40} onChangeText={v => set({ name: v })} />
            <View style={{ gap: 8 }}>
              <T v="label" c="muted">{t('fAisle')}</T>
              <Row gap={6} style={{ flexWrap: 'wrap' }}>
                {AISLE_ORDER.map(a => <Pill key={a} label={aisleName(a, lang)} active={f.aisle === a} onPress={() => set({ aisle: a })} />)}
              </Row>
            </View>
            <Field label={t('fKcal')} value={f.kcal} keyboardType="decimal-pad" onChangeText={v => set({ kcal: decimal(v) })} />
            <T v="caption" c="muted">{t('optionalHint')}</T>
            <Row gap={8} style={{ alignItems: 'flex-start' }}>
              {small('protein', t('fProtein'))}
              {small('carbs', t('fCarbs'))}
              {small('fat', t('fFat'))}
            </Row>
            <Field label={t('fPiece')} value={f.piece} keyboardType="decimal-pad" onChangeText={v => set({ piece: decimal(v) })} />
            {error ? <T v="caption" c="error">{error}</T> : null}
            <Button label={busy ? '…' : t('addFoodBtn')} onPress={busy ? undefined : save} />
            <Pressable onPress={onClose} hitSlop={8} style={{ alignSelf: 'center' }}><T v="bodyStrong" c="muted">{t('cancel')}</T></Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
