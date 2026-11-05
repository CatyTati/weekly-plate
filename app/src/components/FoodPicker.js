// Linking a recipe ingredient to a food in the database, so its calories are counted:
// suggestions while typing, "did you mean" for typos, and adding a food that isn't there yet.
import React, { useState } from 'react';
import { Keyboard, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store';
import { isDemo } from '../auth';
import { AISLE_ORDER, U, aisleName, num } from '../logic';
import { didYouMean, exactFood, foodName, matchFood, normalize, suggestFoods } from '../nutrition';
import { suggestFood, updateFood, useFoods } from '../foods';
import { findNutrition } from '../lookup';
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
              <T v="label" c="muted">{num(Math.round(food.kcal), lang)} {t('kcalPer100')}</T>
            </Row>
          </Pressable>
        ))}
        {isDemo || exactFood(text, index) ? null : (
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

const LANGS = ['he', 'en', 'ru'];
const str = v => (v == null ? '' : String(v));
const nameList = v => v.split(',').map(x => x.trim()).filter(Boolean);

/**
 * A short form for a food: adding one that isn't in the database (it's yours right away and
 * waits for approval), or, for an admin, changing any food's names and values (`food`).
 * Admins write the names in every language, a comma between names that mean the same food.
 */
export function AddFoodSheet({ name, food, onClose, onAdded }) {
  const { state, user, t, rtl } = useStore();
  const insets = useSafeAreaInsets();
  const { admin, index } = useFoods();
  const lang = state.lang;
  const [f, setF] = useState(() => food ? {
    names: Object.fromEntries(LANGS.map(l => [l, (food.names?.[l] || []).join(', ')])), aisle: food.aisle,
    kcal: str(food.kcal), protein: str(food.protein), carbs: str(food.carbs), fat: str(food.fat), piece: str(food.piece_g),
  } : { names: { he: '', en: '', ru: '', [lang]: name }, aisle: 'pantry', kcal: '', protein: '', carbs: '', fat: '', piece: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = patch => { setF(x => ({ ...x, ...patch })); setError(''); };
  const setName = (l, v) => set({ names: { ...f.names, [l]: v } });
  const [look, setLook] = useState({ busy: false, list: null, from: '', failed: false });

  // A name that already belongs to another food in the database.
  const typed = (admin ? LANGS : [lang]).flatMap(l => nameList(f.names[l] || ''));
  const dupe = typed.map(n => exactFood(n, index)).find(x => x && x.id !== food?.id) || null;

  const lookUp = () => {
    Keyboard.dismiss();
    setLook({ busy: true, list: null, from: '', failed: false });
    findNutrition(LANGS.map(l => nameList(f.names[l] || '')[0]))
      .then(list => setLook({ busy: false, list, from: '', failed: false }))
      .catch(() => setLook({ busy: false, list: null, from: '', failed: true }));
  };
  const usePick = p => {
    set({ kcal: str(p.kcal), protein: str(p.protein), carbs: str(p.carbs), fat: str(p.fat) });
    setLook({ busy: false, list: null, from: [p.name, p.brand].filter(Boolean).join(' · '), failed: false });
  };

  const save = () => {
    const kcal = Number(f.kcal);
    const names = Object.fromEntries((admin ? LANGS : [lang]).map(l => [l, nameList(f.names[l])]).filter(([, list]) => list.length));
    if (!Object.keys(names).length) return setError(t('eFoodName'));
    if (dupe) return setError(t('foodExists', { n: foodName(dupe, lang) }));
    if (f.kcal === '' || !(kcal >= 0 && kcal <= 900)) return setError(t('eKcal'));
    const grams = v => { const n = optional(v); return n == null ? null : Math.min(100, Math.max(0, n)); };
    const values = {
      names, aisle: f.aisle, kcal, protein: grams(f.protein), carbs: grams(f.carbs), fat: grams(f.fat),
      piece_g: optional(f.piece) > 0 ? optional(f.piece) : null,
    };
    setBusy(true);
    (food ? updateFood(food.id, values) : suggestFood(user.id, { ...values, density: null }))
      .then(onAdded).catch(() => { setError(t('eNetwork')); setBusy(false); });
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
            <T v="title">{t(food ? 'editFoodTitle' : 'newFoodTitle')}</T>
            <T v="caption" c="muted">{t(food ? 'editFoodHint' : admin ? 'newFoodHintAdmin' : 'newFoodHint')}</T>
            {admin ? (
              <>
                {LANGS.map(l => (
                  <Field key={l} label={t('fFoodNameIn_' + l)} value={f.names[l]} maxLength={120} onChangeText={v => setName(l, v)}
                    inputStyle={l === 'he' ? null : { writingDirection: 'ltr', textAlign: rtl ? 'right' : 'left' }} />
                ))}
                <T v="caption" c="muted">{t('namesHint')}</T>
              </>
            ) : (
              <Field label={t('fFoodName')} value={f.names[lang]} maxLength={40} onChangeText={v => setName(lang, v)} />
            )}
            {dupe ? (
              <Row gap={6} style={{ backgroundColor: color.errorSoft, borderRadius: 12, padding: 10 }}>
                <Icon name="alert" c="error" size={16} />
                <T v="caption" c="error" style={{ flex: 1 }}>{t('foodExists', { n: foodName(dupe, lang) })}</T>
              </Row>
            ) : null}
            {dupe ? null : <>
            <Pressable onPress={look.busy ? undefined : lookUp} accessibilityRole="button"
              style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 14,
                borderWidth: 1.5, borderColor: color.accent, backgroundColor: pressed ? color.accent : color.accentSoft })}>
              {({ pressed }) => (
                <>
                  <Icon name="search" c={pressed ? 'onAccent' : 'accent'} size={18} />
                  <T v="bodyStrong" c={pressed ? 'onAccent' : 'accent'}>{t(look.busy ? 'findingValues' : 'findValues')}</T>
                </>
              )}
            </Pressable>
            {look.failed ? <T v="caption" c="error">{t('eNetwork')}</T> : null}
            {look.list && !look.list.length ? <T v="caption" c="muted">{t('noValuesFound')}</T> : null}
            {look.list?.length ? (
              <View style={{ gap: 6 }}>
                <T v="label" c="muted">{t('pickValues')}</T>
                <View style={{ backgroundColor: color.surface, borderRadius: 14, borderWidth: 1, borderColor: color.edge, overflow: 'hidden' }}>
                  {look.list.map(p => (
                    <Pressable key={p.id + p.name} onPress={() => usePick(p)} accessibilityRole="button"
                      style={({ pressed }) => ({ paddingHorizontal: 14, paddingVertical: 10, gap: 2, backgroundColor: pressed ? color.accentSoft : 'transparent', borderBottomWidth: 1, borderColor: color.line })}>
                      <Row gap={8}>
                        <T v="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>{p.name}</T>
                        <T v="label" c="accent">{num(p.kcal, lang)} {t('kcalPer100')}</T>
                      </Row>
                      <T v="caption" c="muted" numberOfLines={1}>
                        {[p.brand, ...[['proteinLabel', p.protein], ['carbsLabel', p.carbs], ['fatLabel', p.fat]].filter(([, v]) => v != null).map(([k, v]) => `${t(k)} ${num(v, lang)}`)].filter(Boolean).join(' · ')}
                      </T>
                    </Pressable>
                  ))}
                </View>
                <T v="caption" c="muted">{t('valuesSource')}</T>
              </View>
            ) : null}
            {look.from ? (
              <Row gap={6} style={{ backgroundColor: color.accentSoft, borderRadius: 12, padding: 10 }}>
                <Icon name="check" c="accent" size={16} />
                <T v="caption" c="accent" style={{ flex: 1 }}>{t('valuesFrom', { n: look.from })}</T>
              </Row>
            ) : null}
            </>}
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
            <Button label={busy ? '…' : t(food ? 'save' : 'addFoodBtn')} onPress={busy ? undefined : save} disabled={!!dupe} />
            <Pressable onPress={onClose} hitSlop={8} style={{ alignSelf: 'center' }}><T v="bodyStrong" c="muted">{t('cancel')}</T></Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
