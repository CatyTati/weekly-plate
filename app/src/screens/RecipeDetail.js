import React, { useState } from 'react';
import { Share, View } from 'react-native';
import { useStore } from '../store';
import { useNav } from '../nav';
import { cost, fmtQty, hasPrice, ingName, money, pick } from '../logic';
import { RECIPE_STEPS } from '../steps';
import AddToWeekSheet from './AddToWeek';
import { RECIPE_DESC } from '../strings2';
import { color } from '../theme';
import { Button, Card, Pill, Row, RoundButton, Screen, T, Tag } from '../components/ui';
import PhotoSlider from '../components/PhotoSlider';

function NoPhoto() {
  return (
    <View style={{ height: 220, borderRadius: 28, backgroundColor: '#F6E3DA', alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 150, height: 150, borderRadius: 75, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 110, height: 110, borderRadius: 55, backgroundColor: '#E59A86' }} />
      </View>
    </View>
  );
}

export default function RecipeDetail({ id, recipe, canCopy, back }) {
  const { state, t, byId, deleteRecipe, copyRecipe } = useStore();
  const { open } = useNav();
  const r = recipe || byId(id); // `recipe` is someone else's, shown read-only
  const theirs = !!recipe;
  const copied = theirs && state.custom.some(x => x.copiedFrom === recipe.cloud);
  const lang = state.lang;
  const [picking, setPicking] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  if (!r) return null;
  const steps = r.steps ? r.steps.split('\n').map(x => x.trim()).filter(Boolean) : RECIPE_STEPS[r.id]?.[lang] || [];
  const desc = pick(r.desc || RECIPE_DESC[r.id], lang);
  const serves = r.serves || 4; // amounts are kept for 4 people
  const text = `${pick(r.name, lang)}\n` + r.ing.map(([n, q, u]) => `• ${ingName(n, lang)} – ${fmtQty(q * serves / 4, u, lang)}`).join('\n') + (steps.length ? '\n\n' + steps.join('\n') : '');

  return (
    <Screen header={
      <Row style={{ justifyContent: 'space-between' }}>
        {r.custom && !theirs ? (
          <Row gap={8}>
            <Pill label={t('edit')} onPress={() => open('add', { id: r.id })} />
            <Pill label={confirmDel ? t('delConfirm') : t('del')} active={confirmDel} c="error" soft="errorSoft"
              onPress={() => { if (confirmDel) { deleteRecipe(r.id); back(); } else setConfirmDel(true); }} />
          </Row>
        ) : <View />}
        <RoundButton icon="close" label={t('close')} onPress={back} />
      </Row>
    } footer={theirs ? (
      canCopy
        ? <Button kind={copied ? 'secondary' : 'primary'} label={copied ? t('copiedRecipe') : t('copyRecipe')} onPress={() => { if (!copied) copyRecipe(recipe); }} />
        : <T v="caption" c="muted" center>{t('copyNeedsApproval')}</T>
    ) : (
      <Row gap={10}>
        <Button kind="secondary" label={t('share')} style={{ paddingHorizontal: 20 }} onPress={() => Share.share({ message: text }).catch(() => {})} />
        <Button label={t('addToWeek')} style={{ flex: 1 }} onPress={() => setPicking(true)} />
      </Row>
    )}>
      {picking ? <AddToWeekSheet id={r.id} onClose={() => setPicking(false)} /> : null}
      <PhotoSlider photos={r.photos} height={220} radius={28} empty={<NoPhoto />} />
      <View style={{ gap: 8 }}>
        <T v="title">{pick(r.name, lang)}</T>
        {desc ? <T c="muted">{desc}</T> : null}
        <Row gap={6} style={{ flexWrap: 'wrap' }}>{r.tags.map(k => <Tag key={k} k={k} />)}</Row>
        <T v="caption" c="muted">{r.time} {t('min')}{hasPrice(r) ? ` · ${t('perServing', { c: money(cost(r, 4) / 4, lang) })}` : ''}</T>
      </View>
      {r.kid ? <View style={{ backgroundColor: color.kidsSoft, borderRadius: 16, padding: 12 }}><T v="caption" c="kids">{t('forKids')} {pick(r.kid, lang)}</T></View> : null}
      <T v="heading">{t('ingFor', { n: serves })}</T>
      <Card style={{ gap: 12 }}>
        {r.ing.map(([n, q, u]) => (
          <Row key={n + u} style={{ justifyContent: 'space-between' }}>
            <T>{ingName(n, lang)}</T>
            <T v="caption" c="muted">{fmtQty(q * serves / 4, u, lang)}</T>
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
