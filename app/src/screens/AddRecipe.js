import React, { useRef, useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useStore } from '../store';
import { AISLE_ORDER, LIMITS, TAG_KEYS, U, UNITS, aisleName, unitName, validateRecipe } from '../logic';
import { color } from '../theme';
import { Button, Field, Icon, Pill, Row, RoundButton, Screen, T } from '../components/ui';

const blank = () => ({ n: '', q: '', u: U, a: 'veg' });

export default function AddRecipe({ back }) {
  const { state, t, recipes, addRecipe } = useStore();
  const lang = state.lang;
  const [form, setForm] = useState({ name: '', time: '30', steps: '', kid: '', tags: {}, ing: [blank(), blank(), blank()], photos: [] });
  const [errors, setErrors] = useState({});
  const [photoError, setPhotoError] = useState('');
  const [tried, setTried] = useState(false);
  const scroll = useRef(null);

  const update = (patch, clear) => { setForm(f => ({ ...f, ...patch })); if (clear) setErrors(e => { const n = { ...e }; delete n[clear]; return n; }); };
  const setRow = (i, patch) => update({ ing: form.ing.map((r, j) => (j === i ? { ...r, ...patch } : r)) }, 'ing.' + i);

  async function pickPhotos() {
    setPhotoError('');
    const left = LIMITS.photos - form.photos.length;
    if (left <= 0) return setPhotoError(t('ePhotoMax', { m: LIMITS.photos, f: '' }).replace(' ""', ''));
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return setPhotoError(t('photoPerm'));
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: left, quality: 0.7 });
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
    const res = validateRecipe(form, recipes, t);
    setErrors(res.errors);
    if (res.value) { addRecipe(res.value); back(); }
    else scroll.current?.scrollTo?.({ y: 0, animated: true });
  }

  const count = Object.keys(errors).length;
  const ingError = errors.ing || Object.entries(errors).find(([k]) => k.startsWith('ing.'))?.[1];

  return (
    <Screen footer={<Button label={t('saveBtn')} onPress={save} />}>
      <Row style={{ justifyContent: 'space-between' }}>
        <RoundButton icon="back" flip label={t('back')} onPress={back} />
        <T v="heading" center style={{ flex: 1 }}>{t('newRecipe')}</T>
        <Pressable onPress={back} hitSlop={8}><T v="bodyStrong" c="muted">{t('cancel')}</T></Pressable>
      </Row>

      {tried && count ? (
        <Row gap={10} style={{ backgroundColor: color.errorSoft, borderRadius: 16, padding: 12 }} accessibilityLiveRegion="polite">
          <Icon name="alert" c="error" size={20} />
          <T v="bodyStrong" c="error" style={{ flex: 1 }}>{count === 1 ? t('errSum1') : t('errSumN', { n: count })}</T>
        </Row>
      ) : null}

      <View style={{ gap: 8 }}>
        <T v="label" c="muted">{t('fPhotos', { m: LIMITS.photos })}</T>
        <Row gap={10}>
          {form.photos.map((uri, i) => (
            <View key={uri} style={{ width: 96, height: 80 }}>
              <Image source={{ uri }} style={{ width: 96, height: 80, borderRadius: 18 }} />
              {i === 0 ? <View style={{ position: 'absolute', bottom: 6, start: 6, backgroundColor: color.accent, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 1 }}><T v="label" c="onAccent">{t('mainPhoto')}</T></View> : null}
              <View style={{ position: 'absolute', top: 4, end: 4 }}>
                <RoundButton icon="close" size={26} bg="ink" c="surface" label={t('rmPhoto', { i: i + 1 })} onPress={() => update({ photos: form.photos.filter((_, j) => j !== i) })} />
              </View>
            </View>
          ))}
          {form.photos.length < LIMITS.photos ? (
            <Pressable onPress={pickPhotos} accessibilityRole="button" accessibilityLabel={t('addPhoto')}
              style={{ width: 96, height: 80, borderRadius: 18, borderWidth: 1.5, borderStyle: 'dashed', borderColor: color.line, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center', gap: 2 }}>
              <Icon name="camera" c="accent" />
              <T v="label" c="accent" center>{t('left', { b: LIMITS.photos - form.photos.length })}</T>
            </Pressable>
          ) : null}
        </Row>
        {photoError ? <T v="caption" c="error">{photoError}</T> : null}
      </View>

      <Field label={t('fName')} value={form.name} maxLength={LIMITS.nameMax} error={errors.name} onChangeText={v => update({ name: v }, 'name')} />
      <Field label={t('fTime')} value={form.time} keyboardType="number-pad" error={errors.time} onChangeText={v => update({ time: v.replace(/\D/g, '') }, 'time')} />

      <View style={{ gap: 8 }}>
        <T v="label" c="muted">{t('fTags')}</T>
        <Row gap={6} style={{ flexWrap: 'wrap' }}>
          {TAG_KEYS.map(k => <Pill key={k} label={t('tag_' + k)} active={!!form.tags[k]} onPress={() => update({ tags: { ...form.tags, [k]: !form.tags[k] } })} />)}
        </Row>
      </View>
      {form.tags.kids ? <Field label={t('fKid')} placeholder={t('fKidPh')} value={form.kid} maxLength={100} onChangeText={v => update({ kid: v })} /> : null}

      <View style={{ gap: 8 }}>
        <T v="label" c="muted">{t('fIng')}</T>
        {form.ing.map((r, i) => {
          const bad = !!errors['ing.' + i];
          return (
            <View key={i} style={{ gap: 6, padding: 10, borderRadius: 16, backgroundColor: bad ? color.errorSoft : color.surface, borderWidth: bad ? 1.5 : 1, borderColor: bad ? color.error : color.line }}>
              <Row gap={8}>
                <Field style={{ flex: 1 }} placeholder={t('ingPh')} value={r.n} maxLength={40} onChangeText={v => setRow(i, { n: v })} accessibilityLabel={t('ingNameAria', { i: i + 1 })} />
                <Field style={{ width: 76 }} placeholder={t('colQty')} value={r.q} keyboardType="decimal-pad" onChangeText={v => setRow(i, { q: v.replace(',', '.') })} accessibilityLabel={t('qtyAria', { i: i + 1 })} />
                <RoundButton icon="minus" size={32} bg="bg" c="muted" label={t('rmIng', { i: i + 1 })}
                  onPress={() => form.ing.length > 1 && update({ ing: form.ing.filter((_, j) => j !== i) })} />
              </Row>
              <Row gap={6} style={{ flexWrap: 'wrap' }}>
                {UNITS.slice(0, 6).map(u => <Pill key={u} label={unitName(u, lang)} active={r.u === u} onPress={() => setRow(i, { u })} />)}
              </Row>
              <Row gap={6} style={{ flexWrap: 'wrap' }}>
                {AISLE_ORDER.map(a => <Pill key={a} label={aisleName(a, lang)} active={r.a === a} onPress={() => setRow(i, { a })} />)}
              </Row>
            </View>
          );
        })}
        {ingError ? <T v="caption" c="error">{ingError}</T> : null}
        <Pressable onPress={() => form.ing.length < LIMITS.ingMax && update({ ing: [...form.ing, blank()] }, 'ing')} hitSlop={8}>
          <Row gap={6}><Icon name="plus" c="accent" size={18} /><T v="bodyStrong" c="accent">{t('addIng')}</T></Row>
        </Pressable>
      </View>

      <Field label={t('fSteps')} placeholder={t('stepsPh')} value={form.steps} multiline maxLength={3000} error={errors.steps}
        inputStyle={{ minHeight: 110, textAlignVertical: 'top' }} onChangeText={v => update({ steps: v }, 'steps')} />
    </Screen>
  );
}
