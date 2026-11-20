import React, { useRef, useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useStore } from '../store';
import { LIMITS, MEALS, TAG_KEYS, U, UNITS, fmtQty, mealsOf, num, unitName, validateRecipe } from '../logic';
import { foodName, gramsOf, looksTooMuch, matchFood } from '../nutrition';
import { useFoods } from '../foods';
import { isDemo } from '../auth';
import { File } from 'expo-file-system';
import { PDF_MAX_MB, SHOTS_MAX, recipeFromFile } from '../social';
import { FoodHint, linkRow } from '../components/FoodPicker';
import { color, font } from '../theme';
import { Button, Card, ConfirmDialog, Field, Icon, Pill, Row, RoundButton, Screen, Stepper, T } from '../components/ui';

const blank = () => ({ n: '', q: '', u: U, a: 'pantry', f: null }); // f: the food it's linked to
const empty = () => ({ name: '', desc: '', time: '30', serves: 4, meals: ['dinner'], steps: '', kid: '', tags: {}, ing: [blank(), blank(), blank()], photos: [] });
// The app keeps amounts for 4 people; the form shows them for the recipe's own number.
const round = q => String(Math.round(q * 100) / 100);
// One of your recipes, as the form shows it.
const toForm = r => {
  const serves = r.serves || 4;
  return {
    name: r.name, desc: r.desc || '', time: String(r.time), serves, meals: mealsOf(r), steps: r.steps || '', kid: r.kid || '',
    tags: Object.fromEntries(r.tags.map(k => [k, true])), photos: r.photos || [],
    ing: r.ing.map(([n, q, u, a, , f]) => ({ n, q: round(q * serves / 4), u, a: a || 'pantry', f: f || null })),
  };
};

/** A titled card that groups part of the form. */
function Section({ icon, title, children }) {
  return (
    <Card style={{ gap: 14 }}>
      <Row gap={10}>
        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: color.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} c="accent" size={17} />
        </View>
        <T v="heading" style={{ flex: 1 }}>{title}</T>
      </Row>
      {children}
    </Card>
  );
}

/** The unit of one ingredient, as one row of equal segments. */
function Units({ value, lang, onChange }) {
  return (
    <Row gap={0} style={{ backgroundColor: color.surface, borderRadius: 12, padding: 3, borderWidth: 1, borderColor: color.line }}>
      {UNITS.slice(0, 7).map(u => {
        const on = u === value;
        return (
          <Pressable key={u} onPress={() => onChange(u)} accessibilityRole="button" accessibilityState={{ selected: on }}
            style={{ flex: 1, paddingVertical: 7, borderRadius: 9, backgroundColor: on ? color.accent : 'transparent' }}>
            <T v="label" c={on ? 'onAccent' : 'muted'} center style={{ fontFamily: font.medium }}>{unitName(u, lang)}</T>
          </Pressable>
        );
      })}
    </Row>
  );
}

/** A new recipe, or with `id`, changes to one of yours. */
export default function AddRecipe({ id, back }) {
  const { state, t, recipes, byId, addRecipe, updateRecipe } = useStore();
  const lang = state.lang;
  const editing = id ? byId(id) : null;
  const [form, setForm] = useState(() => (editing ? toForm(editing) : empty()));
  const [errors, setErrors] = useState({});
  const [photoError, setPhotoError] = useState('');
  const [tried, setTried] = useState(false);
  const [focused, setFocused] = useState(-1); // which ingredient name is being typed
  const [tooMuch, setTooMuch] = useState(null); // { q, n } when an amount looks like a typo
  const { index, byId: foodById } = useFoods();
  const scroll = useRef(null);
  const picking = useRef(false); // a second tap while the picker opens would stack another picker
  const [reading, setReading] = useState(null); // { busy, note, error } while filling the form from a screenshot

  const update = (patch, clear) => { setForm(f => ({ ...f, ...patch })); if (clear) setErrors(e => { const n = { ...e }; delete n[clear]; return n; }); };
  const setRow = (i, patch) => update({ ing: form.ing.map((r, j) => (j === i ? { ...r, ...patch } : r)) }, 'ing.' + i);

  // Fills the form from a screenshot or a PDF of a recipe. Neither is kept or added as a photo.
  async function fillFrom(kind) {
    if (picking.current || reading?.busy) return;
    picking.current = true;
    let file;
    try {
      if (kind === 'pdf') {
        const res = await File.pickFileAsync({ mimeTypes: 'application/pdf' });
        if (res.canceled) return;
        console.log(`PDF picked: ${((res.result.size || 0) / 1024 / 1024).toFixed(2)} MB`);
        const mb = (res.result.size || 0) / 1024 / 1024;
        if (mb > PDF_MAX_MB) { setReading({ error: t('readPdfTooBig', { n: PDF_MAX_MB, s: num(Math.round(mb * 10) / 10, lang) }) }); return; }
        setReading({ busy: true });
        file = { pdf: await res.result.base64() };
      } else {
        // Several screenshots of one long recipe, in the order they were picked; one fill.
        const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1,
          allowsMultipleSelection: true, selectionLimit: SHOTS_MAX, orderedSelection: true });
        if (res.canceled) return;
        file = { images: res.assets.map(a => a.uri) };
      }
    } catch (e) {
      console.warn('Choosing the file failed:', e?.message || e);
      setReading({ error: t('readFailed') });
      return;
    } finally {
      picking.current = false;
    }
    setReading({ busy: true });
    try {
      const { recipe: r, left } = await recipeFromFile(file, lang);
      const ing = r.ing.map(i => ({ n: i.n, q: round(i.q), u: i.u, a: matchFood(i.n, index)?.aisle || 'pantry', f: null }));
      setForm(f => ({ ...f, name: r.name, desc: r.desc, time: String(r.time), serves: r.serves, meals: r.meals, steps: r.steps, ing: ing.length ? ing : f.ing }));
      setErrors({});
      setReading({ note: left == null ? t('readDoneNoLimit') : t('readDone', { n: left }) });
    } catch (e) {
      console.warn('Reading the recipe failed:', e?.message || e);
      const key = { limit: 'readLimit', not_a_recipe: 'readNoRecipe', refused: 'readNoRecipe', pdf_too_big: 'readPdfTooBig', pdf_too_long: 'readPdfTooLong' }[e.message] || 'readFailed';
      setReading({ error: t(key, { n: e.message === 'pdf_too_big' ? PDF_MAX_MB : e.message === 'pdf_too_long' ? 5 : e.limit, s: `${PDF_MAX_MB}+` }) });
    }
  }

  async function pickPhotos() {
    setPhotoError('');
    const left = LIMITS.photos - form.photos.length;
    if (left <= 0) return setPhotoError(t('ePhotoMax', { m: LIMITS.photos, f: '' }).replace(' ""', ''));
    if (picking.current) return;
    picking.current = true;
    let res;
    try {
      // The system photo picker needs no library permission.
      res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: left, quality: 0.7 });
    } finally {
      picking.current = false;
    }
    if (res.canceled) return;
    const errs = [];
    const ok = [];
    for (const a of res.assets) {
      const name = a.fileName || 'photo';
      if (a.fileSize && a.fileSize > 10 * 1024 * 1024) errs.push(t('ePhotoSize', { f: name, mb: 10 }));
      else if (a.mimeType && !['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic'].includes(a.mimeType)) errs.push(t('ePhotoType', { f: name }));
      else ok.push(a.uri);
    }
    update({ photos: [...form.photos, ...ok].slice(0, LIMITS.photos) });
    setPhotoError(errs.join(' '));
  }

  // Rows typed without picking a suggestion are linked to the food their name matches.
  const linked = rows => rows.map(r => {
    if (r.f || !r.n.trim()) return r;
    const food = matchFood(r.n, index);
    return food ? { ...r, f: food.id, a: food.aisle } : r;
  });

  function save(anyway) {
    setTried(true);
    const checked = { ...form, ing: linked(form.ing) };
    const res = validateRecipe(checked, editing ? recipes.filter(r => r.id !== id) : recipes, t);
    setErrors(res.errors);
    if (res.value && !anyway) {
      for (const r of checked.ing) {
        const food = r.f && foodById.get(r.f);
        const g = food && Number(r.q) > 0 ? gramsOf(Number(r.q), r.u, food) : null;
        if (g != null && looksTooMuch(food, g / form.serves)) {
          setTooMuch({ q: fmtQty(Number(r.q) / form.serves, r.u, lang), n: r.n.trim() || foodName(food, lang) });
          return;
        }
      }
    }
    if (res.value) {
      const per4 = 4 / form.serves;
      const r = { ...res.value, serves: form.serves, desc: form.desc.trim(), ing: res.value.ing.map(([n, q, ...rest]) => [n, q * per4, ...rest]) };
      if (editing) updateRecipe({ ...r, id });
      else addRecipe(r);
      back();
    }
    else scroll.current?.scrollTo?.({ y: 0, animated: true });
  }

  const count = Object.keys(errors).length;
  const ingError = errors.ing || Object.entries(errors).find(([k]) => k.startsWith('ing.'))?.[1];

  return (
    <Screen scrollRef={scroll} footer={<Button label={t('saveBtn')} onPress={() => save(false)} />}>
      {tooMuch ? (
        <ConfirmDialog title={t('tooMuchTitle')} message={t('tooMuchBody', tooMuch)} confirmLabel={t('saveAnyway')} cancelLabel={t('fixIt')}
          onCancel={() => setTooMuch(null)} onConfirm={() => { setTooMuch(null); save(true); }} />
      ) : null}
      <Row style={{ justifyContent: 'space-between' }}>
        <View style={{ width: 40 }} />
        <T v="heading" center style={{ flex: 1 }}>{t(editing ? 'editRecipe' : 'newRecipe')}</T>
        <RoundButton icon="close" label={t('cancel')} onPress={back} />
      </Row>

      {tried && count ? (
        <Row gap={10} style={{ backgroundColor: color.errorSoft, borderRadius: 16, padding: 12 }} accessibilityLiveRegion="polite">
          <Icon name="alert" c="error" size={20} />
          <T v="bodyStrong" c="error" style={{ flex: 1 }}>{count === 1 ? t('errSum1') : t('errSumN', { n: count })}</T>
        </Row>
      ) : null}

      {editing || isDemo ? null : (
        <View style={{ backgroundColor: color.accentSoft, borderRadius: 20, padding: 14, gap: 8 }}>
          <Row gap={10} style={{ alignItems: 'flex-start' }}>
            <Icon name="camera" c="accent" size={20} />
            <View style={{ flex: 1, gap: 2 }}>
              <T v="bodyStrong" c="accent">{t('readTitle')}</T>
              <T v="caption" c="muted">{t('readHint')}</T>
            </View>
          </Row>
          {reading?.busy ? <Button kind="secondary" label={t('readBusy')} disabled /> : (
            <Row gap={8}>
              <Button kind={reading?.note ? 'secondary' : 'primary'} icon="camera" label={t('readBtn')} style={{ flex: 1 }} onPress={() => fillFrom('image')} />
              <Button kind="secondary" icon="book" label={t('readPdfBtn')} style={{ flex: 1 }} onPress={() => fillFrom('pdf')} />
            </Row>
          )}
          {reading?.note ? <T v="caption" c="accent">{reading.note}</T> : null}
          {reading?.error ? <T v="caption" c="error">{reading.error}</T> : null}
        </View>
      )}

      <Section icon="camera" title={t('fPhotos', { m: LIMITS.photos })}>
        <Row gap={10}>
          {form.photos.map((uri, i) => (
            <View key={uri} style={{ width: 92, height: 92 }}>
              <Image source={{ uri }} style={{ width: 92, height: 92, borderRadius: 18 }} />
              {i === 0 ? <View style={{ position: 'absolute', bottom: 6, start: 6, backgroundColor: color.accent, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 1 }}><T v="label" c="onAccent">{t('mainPhoto')}</T></View> : null}
              <View style={{ position: 'absolute', top: 4, end: 4 }}>
                <RoundButton icon="close" size={26} bg="ink" c="surface" label={t('rmPhoto', { i: i + 1 })} onPress={() => update({ photos: form.photos.filter((_, j) => j !== i) })} />
              </View>
            </View>
          ))}
          {form.photos.length < LIMITS.photos ? (
            <Pressable onPress={pickPhotos} accessibilityRole="button" accessibilityLabel={t('addPhoto')}
              style={{ width: 92, height: 92, borderRadius: 18, borderWidth: 1.5, borderStyle: 'dashed', borderColor: color.accent, backgroundColor: color.accentSoft, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <Icon name="camera" c="accent" />
              <T v="label" c="accent" center>{t('left', { b: LIMITS.photos - form.photos.length })}</T>
            </Pressable>
          ) : null}
        </Row>
        {photoError ? <T v="caption" c="error">{photoError}</T> : null}
      </Section>

      <Section icon="book" title={t('secDetails')}>
        <Field label={t('fName')} value={form.name} maxLength={LIMITS.nameMax} error={errors.name} onChangeText={v => update({ name: v }, 'name')} />
        <Field label={t('fTime')} value={form.time} keyboardType="number-pad" error={errors.time} onChangeText={v => update({ time: v.replace(/\D/g, '') }, 'time')} />
        <View style={{ gap: 8 }}>
          <T v="label" c="muted">{t('fMeal')}</T>
          <Row gap={6} style={{ flexWrap: 'wrap' }}>
            {/* Any number of meals, but never none: the last one stays on. */}
            {MEALS.map(m => {
              const on = form.meals.includes(m);
              return <Pill key={m} label={t('meal_' + m)} active={on}
                onPress={() => (on && form.meals.length === 1 ? null : update({ meals: on ? form.meals.filter(x => x !== m) : [...form.meals, m] }))} />;
            })}
          </Row>
        </View>
        <View style={{ gap: 8 }}>
          <T v="label" c="muted">{t('fTags')}</T>
          <Row gap={6} style={{ flexWrap: 'wrap' }}>
            {TAG_KEYS.map(k => <Pill key={k} label={t('tag_' + k)} active={!!form.tags[k]} onPress={() => update({ tags: { ...form.tags, [k]: !form.tags[k] } })} />)}
          </Row>
        </View>
        {form.tags.kids ? <Field label={t('fKid')} placeholder={t('fKidPh')} value={form.kid} maxLength={100} onChangeText={v => update({ kid: v })} /> : null}
        <Field label={t('fDesc')} placeholder={t('descPh')} value={form.desc} multiline maxLength={160}
          inputStyle={{ minHeight: 70, textAlignVertical: 'top' }} onChangeText={v => update({ desc: v })} />
      </Section>

      <Section icon="shop" title={t('secIng')}>
        <Row style={{ justifyContent: 'space-between', backgroundColor: color.bg, borderRadius: 16, paddingVertical: 8, paddingHorizontal: 12 }}>
          <Row gap={8} style={{ flex: 1 }}>
            <Icon name="users" c="muted" size={18} />
            <T v="caption" c="muted" style={{ flex: 1 }}>{t('fServes')}</T>
          </Row>
          <Stepper value={form.serves} onChange={v => update({ serves: v })} />
        </Row>
        <T v="caption" c="muted">{t('ingAmounts', { n: form.serves })}</T>

        {form.ing.map((r, i) => {
          const bad = !!errors['ing.' + i];
          return (
            <View key={i} style={{ gap: 10, padding: 12, borderRadius: 18, backgroundColor: bad ? color.errorSoft : color.bg, borderWidth: bad ? 1.5 : 0, borderColor: color.error }}>
              <Row gap={8}>
                <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: color.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                  <T v="label" c="accent" center style={{ fontFamily: font.medium }}>{i + 1}</T>
                </View>
                <Field style={{ flex: 1 }} placeholder={t('ingPh')} value={r.n} maxLength={40} onChangeText={v => setRow(i, { n: v, f: null })} accessibilityLabel={t('ingNameAria', { i: i + 1 })}
                  onFocus={() => setFocused(i)} onBlur={() => setFocused(f => (f === i ? -1 : f))} />
                <Field style={{ width: 70 }} inputStyle={{ textAlign: 'center', paddingHorizontal: 6 }} placeholder={t('colQty')} value={r.q} keyboardType="decimal-pad"
                  onChangeText={v => setRow(i, { q: v.replace(',', '.') })} accessibilityLabel={t('qtyAria', { i: i + 1 })} />
                {form.ing.length > 1 ? (
                  <RoundButton icon="trash" size={34} bg="errorSoft" c="error" label={t('rmIng', { i: i + 1 })}
                    onPress={() => update({ ing: form.ing.filter((_, j) => j !== i) }, 'ing.' + i)} />
                ) : null}
              </Row>
              <FoodHint row={r} focused={focused === i} onLink={patch => setRow(i, patch)} />
              <Units value={r.u} lang={lang} onChange={u => setRow(i, { u })} />
            </View>
          );
        })}
        {ingError ? <T v="caption" c="error">{ingError}</T> : null}
        {form.ing.length < LIMITS.ingMax ? (
          <Pressable onPress={() => update({ ing: [...form.ing, blank()] }, 'ing')} accessibilityRole="button"
            style={({ pressed }) => ({ flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', paddingVertical: 13, borderRadius: 18, borderWidth: 1.5, borderStyle: 'dashed', borderColor: color.accent, backgroundColor: pressed ? color.accentSoft : 'transparent' })}>
            <Icon name="plus" c="accent" size={18} />
            <T v="bodyStrong" c="accent">{t('addIng')}</T>
          </Pressable>
        ) : null}
      </Section>

      <Section icon="pot" title={t('secPrep')}>
        <Field label={t('fSteps')} placeholder={t('stepsPh')} value={form.steps} multiline maxLength={3000} error={errors.steps}
          inputStyle={{ minHeight: 130, textAlignVertical: 'top' }} onChangeText={v => update({ steps: v }, 'steps')} />
      </Section>
    </Screen>
  );
}
