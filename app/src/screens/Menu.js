// Side menu: profile, every section, settings, language, log out.
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store';
import { feedFor, firstName, LANGS } from '../logic';
import { color, radius } from '../theme';
import { Avatar, Icon, RoundButton, Row, T } from '../components/ui';

function Item({ icon, label, active, danger, onPress, extra }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress}
      style={({ pressed }) => [st.item, active ? { backgroundColor: color.accentSoft } : null, pressed ? { opacity: 0.7 } : null]}>
      <Icon name={icon} c={active ? 'accent' : danger ? 'error' : 'muted'} />
      <T v={active ? 'bodyStrong' : 'body'} c={active ? 'accent' : danger ? 'error' : 'ink'} style={{ flex: 1 }}>{label}</T>
      {extra}
    </Pressable>
  );
}

export default function Menu({ visible, onClose, current, go, openScreen }) {
  const { state, user, t, rtl, set, logout } = useStore();
  const { width } = useWindowDimensions();
  const w = Math.min(320, width * 0.82);
  const x = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);
  const [confirmOut, setConfirmOut] = useState(false);

  useEffect(() => {
    if (visible) setMounted(true);
    setConfirmOut(false);
    Animated.timing(x, { toValue: visible ? 1 : 0, duration: 220, useNativeDriver: true }).start(({ finished }) => { if (finished && !visible) setMounted(false); });
  }, [visible, x]);

  if (!mounted) return null;
  const hidden = rtl ? w : -w; // the drawer comes in from the start side
  const translateX = x.interpolate({ inputRange: [0, 1], outputRange: [hidden, 0] });
  const fresh = feedFor(state.following).filter(p => p.hours < 24).length;
  const nav = view => () => { onClose(); go(view); };
  const nextLang = () => { const i = LANGS.findIndex(l => l.k === state.lang); set({ lang: LANGS[(i + 1) % LANGS.length].k }); };
  const name = user?.name || firstName(user);

  return (
    <View style={StyleSheet.absoluteFill} accessibilityViewIsModal>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(58,51,64,0.28)', opacity: x }]}>
        <Pressable style={{ flex: 1 }} accessibilityLabel={t('closeMenu')} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[st.drawer, { width, maxWidth: w, start: 0, transform: [{ translateX }] }, rtl ? st.roundLeft : st.roundRight]}>
        <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: 18, gap: 4, flexGrow: 1 }}>
            <Row gap={12} style={{ paddingBottom: 16 }}>
              <Avatar letter={name[0]} size={52} />
              <View style={{ flex: 1 }}>
                <T v="heading" numberOfLines={1}>{name}</T>
                <T v="caption" c="muted" numberOfLines={1}>{user?.email}</T>
              </View>
              <RoundButton icon="close" bg="bg" c="muted" size={36} label={t('closeMenu')} onPress={onClose} />
            </Row>
            <Item icon="home" label={t('home')} active={current === 'home'} onPress={nav('home')} />
            <Item icon="week" label={t('tab_week')} active={current === 'week'} onPress={nav('week')} />
            <Item icon="feed" label={t('feed')} active={current === 'feed'} onPress={nav('feed')}
              extra={fresh ? <View style={st.badge}><T v="label" c="kids">{t('newPosts', { n: fresh })}</T></View> : null} />
            <Item icon="shop" label={t('tab_shop')} active={current === 'shop'} onPress={nav('shop')} />
            <Item icon="pot" label={t('tab_prep')} onPress={() => { onClose(); openScreen('prep'); }} />
            <Item icon="book" label={t('myRecipes')} active={current === 'recipes'} onPress={nav('recipes')} />
            <Item icon="users" label={t('cooksToFollow')} active={current === 'community'} onPress={nav('community')} />
            <View style={{ height: 1, backgroundColor: color.line, marginVertical: 10 }} />
            <Item icon="gear" label={t('settings')} active={current === 'settings'} onPress={nav('settings')} />
            <Item icon="globe" label={t('language')} onPress={nextLang}
              extra={<View style={st.chip}><T v="label" c="muted">{LANGS.find(l => l.k === state.lang).label}</T></View>} />
            <View style={{ flex: 1, minHeight: 24 }} />
            <Item icon="logout" danger label={confirmOut ? t('logoutConfirm') : t('logout')}
              onPress={() => { if (confirmOut) { onClose(); logout(); } else setConfirmOut(true); }} />
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

const st = StyleSheet.create({
  drawer: { position: 'absolute', top: 0, bottom: 0, backgroundColor: color.surface, shadowColor: '#332633', shadowOpacity: 0.18, shadowRadius: 30, elevation: 8 },
  roundLeft: { borderTopLeftRadius: 28, borderBottomLeftRadius: 28 },
  roundRight: { borderTopRightRadius: 28, borderBottomRightRadius: 28 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 16 },
  badge: { backgroundColor: color.kidsSoft, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  chip: { backgroundColor: color.bg, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
});
