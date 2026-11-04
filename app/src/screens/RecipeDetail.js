import React, { useEffect, useState } from 'react';
import { Pressable, Share, View } from 'react-native';
import { useStore } from '../store';
import { useNav } from '../nav';
import { isDemo } from '../auth';
import { copiersOf } from '../social';
import { cost, fmtQty, hasPrice, ingName, money, pick } from '../logic';
import AddToWeekSheet from './AddToWeek';
import { color } from '../theme';
import { Avatar, Button, Card, ConfirmDialog, CopiedNote, Icon, Pill, Row, RoundButton, Screen, T, Tag } from '../components/ui';
import PhotoSlider from '../components/PhotoSlider';
import FoodArt from '../components/FoodArt';

export default function RecipeDetail({ id, recipe, canCopy, back }) {
  const { state, t, byId, deleteRecipe, copyRecipe } = useStore();
  const { open } = useNav();
  const r = recipe || byId(id); // `recipe` is someone else's, shown read-only
  const theirs = !!recipe;
  const copied = theirs && state.custom.some(x => x.copiedFrom === recipe.cloud);
  const lang = state.lang;
  const [picking, setPicking] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [copiers, setCopiers] = useState([]); // who copied this recipe of yours
  const [showCopiers, setShowCopiers] = useState(false);
  const cloud = !theirs && r?.cloud;
  useEffect(() => {
    if (!cloud || isDemo) return undefined;
    let live = true;
    copiersOf(cloud).then(p => { if (live) setCopiers(p); }).catch(() => {});
    return () => { live = false; };
  }, [cloud]);
  if (!r) return null;
  const steps = (r.steps || '').split('\n').map(x => x.trim()).filter(Boolean);
  const desc = pick(r.desc, lang);
  const serves = r.serves || 4; // amounts are kept for 4 people
  const text = `${pick(r.name, lang)}\n` + r.ing.map(([n, q, u]) => `• ${ingName(n, lang)} – ${fmtQty(q * serves / 4, u, lang)}`).join('\n') + (steps.length ? '\n\n' + steps.join('\n') : '');

  return (
    <Screen header={
      <Row style={{ justifyContent: 'space-between' }}>
        {r.custom && !theirs ? (
          <Row gap={8}>
            <Pill label={t('edit')} onPress={() => open('add', { id: r.id })} />
            <Pill label={t('del')} c="error" soft="errorSoft" onPress={() => setConfirmDel(true)} />
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
      {confirmDel ? (
        <ConfirmDialog danger title={t('delTitle')} message={t('delBody', { n: pick(r.name, lang) })} confirmLabel={t('del')}
          onCancel={() => setConfirmDel(false)} onConfirm={() => { setConfirmDel(false); deleteRecipe(r.id); back(); }} />
      ) : null}
      <PhotoSlider photos={r.photos} height={220} radius={28} empty={<FoodArt height={220} />} />
      <View style={{ gap: 8 }}>
        <T v="title">{pick(r.name, lang)}</T>
        <CopiedNote recipe={r} />
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
      {copiers.length ? (
        <Card style={{ gap: 4, paddingVertical: 12 }}>
          <Pressable onPress={() => setShowCopiers(v => !v)} accessibilityRole="button" accessibilityState={{ expanded: showCopiers }} hitSlop={6}>
            <Row gap={10}>
              <Icon name="users" c="accent" size={18} />
              <T v="bodyStrong" style={{ flex: 1 }}>{t('copiedByTitle')} · {copiers.length}</T>
              <T v="label" c="muted">{showCopiers ? '▴' : '▾'}</T>
            </Row>
          </Pressable>
          {showCopiers ? copiers.map(p => (
            <Pressable key={p.id} onPress={() => open('profile', { id: p.id })} accessibilityRole="button" accessibilityLabel={p.name || t('noName')}>
              <Row gap={10} style={{ paddingVertical: 6 }}>
                <Avatar letter={(p.name || '?')[0]} size={32} />
                <T style={{ flex: 1 }}>{p.name || t('noName')}</T>
              </Row>
            </Pressable>
          )) : null}
        </Card>
      ) : null}
      {steps.length ? (
        <Card style={{ gap: 8 }}>
          <T v="heading">{t('method')}</T>
          {steps.map((x, i) => <T key={i}>{i + 1}. {x}</T>)}
        </Card>
      ) : null}
    </Screen>
  );
}
