import React, { useRef, useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useStore } from '../store';
import { LIMITS, TAG_KEYS, U, UNITS, unitName, validateRecipe } from '../logic';
import { color, font } from '../theme';
import { Button, Card, Field, Icon, Pill, Row, RoundButton, Screen, Stepper, T } from '../components/ui';

const blank = () => ({ n: '', q: '', u: U, a: 'veg' });
const empty = () => ({ name: '', desc: '', time: '30', serves: 4, steps: '', kid: '', tags: {}, ing: [blank(), blank(), blank()], photos: [] });
// The app keeps amounts for 4 people; the form shows them for the recipe's own number.
const round = q => String(Math.round(q * 100) / 100);
// One of your recipes, as the form shows it.
const toForm = r => {
  const serves = r.serves || 4;
  return {
    name: r.name, desc: r.desc || '', time: String(r.time), serves, steps: r.steps || '', kid: r.kid || '',
    tags: Object.fromEntries(r.tags.map(k => [k, true])), photos: r.photos || [],
    ing: r.ing.map(([n, q, u, a]) => ({ n, q: round(q * serves / 4), u, a: a || 'veg' })),
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
  const scroll = useRef(null);
  const picking = useRef(false); // a second tap while the picker opens would stack another picker

  const update = (patch, clear) => { setForm(f => ({ ...f, ...patch })); if (clear) setErrors(e => { const n = { ...e }; delete n[clear]; return n; }); };
  const setRow = (i, patch) => update({ ing: form.ing.map((r, j) => (j === i ? { ...r, ...patch } : r)) }, 'ing.' + i);

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

  function save() {
    setTried(true);
    const res = validateRecipe(form, editing ? recipes.filter(r => r.id !== id) : recipes, t);
    setErrors(res.errors);
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
    <Screen scrollRef={scroll} footer={<Button label={t('saveBtn')} onPress={save} />}>
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
                <Field style={{ flex: 1 }} placeholder={t('ingPh')} value={r.n} maxLength={40} onChangeText={v => setRow(i, { n: v })} accessibilityLabel={t('ingNameAria', { i: i + 1 })} />
                <Field style={{ width: 70 }} inputStyle={{ textAlign: 'center', paddingHorizontal: 6 }} placeholder={t('colQty')} value={r.q} keyboardType="decimal-pad"
                  onChangeText={v => setRow(i, { q: v.replace(',', '.') })} accessibilityLabel={t('qtyAria', { i: i + 1 })} />
                {form.ing.length > 1 ? (
                  <RoundButton icon="trash" size={34} bg="errorSoft" c="error" label={t('rmIng', { i: i + 1 })}
                    onPress={() => update({ ing: form.ing.filter((_, j) => j !== i) }, 'ing.' + i)} />
                ) : null}
              </Row>
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
