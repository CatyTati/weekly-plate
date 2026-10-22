import React, { useState } from 'react';
import { Image, ScrollView, Share, View, useWindowDimensions } from 'react-native';
import { useStore } from '../store';
import { cost, dayName, fmtQty, hasPrice, ingName, money, pick } from '../logic';
import { color } from '../theme';
import { Button, Card, Pill, Row, RoundButton, Screen, Stepper, T, Tag } from '../components/ui';

function Photo({ uri }) {
  return uri
    ? <Image source={{ uri }} style={{ width: '100%', height: 220, borderRadius: 28 }} resizeMode="cover" />
    : (
      <View style={{ height: 220, borderRadius: 28, backgroundColor: '#F6E3DA', alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 150, height: 150, borderRadius: 75, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 110, height: 110, borderRadius: 55, backgroundColor: '#E59A86' }} />
        </View>
      </View>
    );
}

export default function RecipeDetail({ id, back }) {
  const { state, t, byId, set, setDay, deleteRecipe } = useStore();
  const { width } = useWindowDimensions();
  const r = byId(id);
  const lang = state.lang;
  const [servings, setServings] = useState(state.servings);
  const [picking, setPicking] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  if (!r) return null;
  const steps = (r.steps || '').split('\n').map(x => x.trim()).filter(Boolean);
  const text = `${pick(r.name, lang)}\n` + r.ing.map(([n, q, u]) => `• ${ingName(n, lang)} – ${fmtQty(q * servings / 4, u, lang)}`).join('\n') + (steps.length ? '\n\n' + steps.join('\n') : '');

  return (
    <Screen footer={
      picking ? (
        <View style={{ gap: 10 }}>
          <T v="label" c="muted">{t('pickDay')}</T>
          <Row gap={6} style={{ flexWrap: 'wrap' }}>
            {[0, 1, 2, 3, 4, 5, 6].map(d => (
              <Pill key={d} label={dayName(d, lang)} onPress={() => { setDay(d, r.id); setPicking(false); back(); }} />
            ))}
          </Row>
        </View>
      ) : (
        <Row gap={10}>
          <Button kind="secondary" label={t('share')} style={{ paddingHorizontal: 20 }} onPress={() => Share.share({ message: text }).catch(() => {})} />
          <Button label={t('addToWeek')} style={{ flex: 1 }} onPress={() => setPicking(true)} />
        </Row>
      )
    }>
      <Row style={{ justifyContent: 'space-between' }}>
        <RoundButton icon="back" flip label={t('back')} onPress={back} />
        {r.custom ? (
          <Pill label={confirmDel ? t('delConfirm') : t('del')} active={confirmDel} c="error" soft="errorSoft"
            onPress={() => { if (confirmDel) { deleteRecipe(r.id); back(); } else setConfirmDel(true); }} />
        ) : null}
      </Row>
      {r.photos?.length > 1 ? (
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -22 }}>
          {r.photos.map(p => <View key={p} style={{ width, paddingHorizontal: 22 }}><Photo uri={p} /></View>)}
        </ScrollView>
      ) : <Photo uri={r.photos?.[0]} />}
      <View style={{ gap: 8 }}>
        <T v="title">{pick(r.name, lang)}</T>
        <Row gap={6} style={{ flexWrap: 'wrap' }}>{r.tags.map(k => <Tag key={k} k={k} />)}</Row>
        <T v="caption" c="muted">{r.time} {t('min')}{hasPrice(r) ? ` · ${t('perServing', { c: money(cost(r, 4) / 4, lang) })}` : ''}</T>
      </View>
      {r.kid ? <View style={{ backgroundColor: color.kidsSoft, borderRadius: 16, padding: 12 }}><T v="caption" c="kids">{t('forKids')} {pick(r.kid, lang)}</T></View> : null}
      <Row style={{ justifyContent: 'space-between' }}>
        <T v="heading">{t('ingFor', { n: servings })}</T>
        <Stepper value={servings} onChange={setServings} />
      </Row>
      <Card style={{ gap: 12 }}>
        {r.ing.map(([n, q, u]) => (
          <Row key={n + u} style={{ justifyContent: 'space-between' }}>
            <T>{ingName(n, lang)}</T>
            <T v="caption" c="muted">{fmtQty(q * servings / 4, u, lang)}</T>
          </Row>
        ))}
      </Card>
      {steps.length ? (
        <Card style={{ gap: 8 }}>
          <T v="heading">{t('method')}</T>
          {steps.map((x, i) => <T key={i}>{i + 1}. {x}</T>)}
        </Card>
      ) : null}
    </Screen>
  );
}
