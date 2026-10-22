import React, { useMemo } from 'react';
import { Pressable, Share, View } from 'react-native';
import { useStore } from '../store';
import { AISLE_ORDER, aisleName, fmtQty, ingName, listText, num, shoppingList } from '../logic';
import { color } from '../theme';
import { Button, Card, Checkbox, Header, Row, Screen, T } from '../components/ui';

export default function Shop() {
  const { state, t, byId, toggleItem, clearChecks } = useStore();
  const lang = state.lang;
  const items = useMemo(() => shoppingList(state.plan.map(byId).filter(Boolean), state.servings), [state.plan, state.servings, byId]);
  const left = items.filter(i => !state.checked[i.key]).length;

  if (!items.length) return <Screen><Header title={t('tab_shop')} /><T c="muted">{t('shopEmpty')}</T></Screen>;

  return (
    <Screen footer={<Button icon="share" label={t('sendList')} onPress={() => Share.share({ message: listText(items, lang, t) }).catch(() => {})} />}>
      <Header title={t('tab_shop')} sub={`${t('itemsLeft')}: ${num(left, lang)} / ${num(items.length, lang)}`}
        right={<Pressable onPress={clearChecks} hitSlop={8}><T v="label" c="accent">{t('clearChecks')}</T></Pressable>} />
      {AISLE_ORDER.map(a => {
        const list = items.filter(i => i.a === a).sort((x, y) => ingName(x.n, lang).localeCompare(ingName(y.n, lang)));
        if (!list.length) return null;
        return (
          <Card key={a} style={{ gap: 0, paddingVertical: 8 }}>
            <T v="label" c="muted" style={{ paddingVertical: 6 }}>{aisleName(a, lang)}</T>
            {list.map((i, idx) => {
              const done = !!state.checked[i.key];
              return (
                <Pressable key={i.key} accessibilityRole="checkbox" accessibilityState={{ checked: done }} onPress={() => toggleItem(i.key)}>
                  <Row gap={12} style={{ paddingVertical: 12, borderTopWidth: idx ? 1 : 0, borderTopColor: color.line }}>
                    <Checkbox checked={done} />
                    <T v={done ? 'body' : 'bodyStrong'} c={done ? 'muted' : 'ink'} style={[{ flex: 1 }, done ? { textDecorationLine: 'line-through' } : null]}>{ingName(i.n, lang)}</T>
                    <T v="caption" c="muted">{fmtQty(i.q, i.u, lang)}</T>
                  </Row>
                </Pressable>
              );
            })}
          </Card>
        );
      })}
    </Screen>
  );
}
