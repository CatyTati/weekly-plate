// Side menu: profile, the four main sections, settings, language, log out.
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store';
import { firstName } from '../logic';
import { LanguageSwitch } from './Onboarding';
import { isDemo } from '../auth';
import { myConnections } from '../social';
import { useFoods } from '../foods';
import { color, onThemeChange, radius } from '../theme';
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
  const { state, user, t, rtl, logout } = useStore();
  const { admin } = useFoods();
  const { width } = useWindowDimensions();
  const w = Math.min(320, width * 0.82);
  const x = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);
  const [counts, setCounts] = useState(null);

  useEffect(() => {
    if (!visible || isDemo) return;
    myConnections(user?.id).then(c => setCounts({ followers: c.followers.length, following: c.following.filter(p => p.status === 'approved').length, requests: c.requests.length })).catch(() => {});
  }, [visible, user?.id]);
  const [confirmOut, setConfirmOut] = useState(false);

  useEffect(() => {
    if (visible) setMounted(true);
    setConfirmOut(false);
    Animated.timing(x, { toValue: visible ? 1 : 0, duration: 220, useNativeDriver: true }).start(({ finished }) => { if (finished && !visible) setMounted(false); });
  }, [visible, x]);

  if (!mounted) return null;
  const hidden = rtl ? w : -w; // the drawer comes in from the start side
  const translateX = x.interpolate({ inputRange: [0, 1], outputRange: [hidden, 0] });
  const nav = view => () => { onClose(); go(view); };
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
                {counts ? (
                  <Pressable onPress={() => { onClose(); openScreen('people', { tab: 'followers' }); }} hitSlop={6} accessibilityRole="button">
                    <T v="caption" c="accent">{t('myFollow', { a: counts.followers, b: counts.following })}</T>
                  </Pressable>
                ) : null}
              </View>
              <RoundButton icon="close" bg="bg" c="muted" size={36} label={t('closeMenu')} onPress={onClose} />
            </Row>
            <Item icon="home" label={t('home')} active={current === 'home'} onPress={nav('home')} />
            <Item icon="week" label={t('tab_week')} active={current === 'week'} onPress={nav('week')} />
            <Item icon="feed" label={t('feed')} active={current === 'feed'} onPress={nav('feed')} />
            <Item icon="shop" label={t('tab_shop')} active={current === 'shop'} onPress={nav('shop')} />
            <View style={{ height: 1, backgroundColor: color.line, marginVertical: 10 }} />
            <Item icon="users" label={t('people_title')} onPress={() => { onClose(); openScreen('people', { tab: counts?.requests ? 'requests' : 'followers' }); }}
              extra={counts?.requests ? <View style={st.badge}><T v="label" c="accent">{t('newRequests', { n: counts.requests })}</T></View> : null} />
            {admin ? <Item icon="book" label={t('foodsTitle')} onPress={() => { onClose(); openScreen('foods'); }} /> : null}
            <Item icon="gear" label={t('settings')} active={current === 'settings'} onPress={nav('settings')} />
            <View style={st.item}>
              <Icon name="globe" c="muted" />
              <T style={{ flex: 1 }}>{t('language')}</T>
              <LanguageSwitch />
            </View>
            <View style={{ flex: 1, minHeight: 24 }} />
            <Item icon="logout" danger label={confirmOut ? t('logoutConfirm') : t('logout')}
              onPress={() => { if (confirmOut) { onClose(); logout(); } else setConfirmOut(true); }} />
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

let st;
const makeStyles = () => StyleSheet.create({
  drawer: { position: 'absolute', top: 0, bottom: 0, backgroundColor: color.surface, shadowColor: '#332633', shadowOpacity: 0.18, shadowRadius: 30, elevation: 8 },
  roundLeft: { borderTopLeftRadius: 28, borderBottomLeftRadius: 28 },
  roundRight: { borderTopRightRadius: 28, borderBottomRightRadius: 28 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 16 },
  badge: { backgroundColor: color.accentSoft, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
});
onThemeChange(() => { st = makeStyles(); });

