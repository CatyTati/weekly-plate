// Shared UI pieces that match the Figma components.
// Direction: the root view sets `direction: 'rtl'` for Hebrew, which mirrors
// every row. Text alignment is set explicitly so it follows the language too.
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, font, radius, shadow, tagColor, type } from '../theme';
import { useStore } from '../store';
import { useNav } from '../nav';

export function T({ v = 'body', c = 'ink', center, style, children, ...rest }) {
  const { rtl } = useStore();
  return (
    <Text
      style={[type[v], { color: color[c] || c, textAlign: center ? 'center' : rtl ? 'right' : 'left', writingDirection: rtl ? 'rtl' : 'ltr' }, style]}
      {...rest}
    >
      {children}
    </Text>
  );
}

const ICONS = {
  week: <><Rect x="3" y="4" width="18" height="18" rx="3" /><Path d="M16 2v4M8 2v4M3 10h18" /></>,
  shop: <><Circle cx="9" cy="20" r="1.5" /><Circle cx="18" cy="20" r="1.5" /><Path d="M2 3h3l2.7 12.4a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.6L22 7H6" /></>,
  recipes: <><Path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z" /><Path d="M6.5 17A2.5 2.5 0 0 0 4 19.5 2.5 2.5 0 0 0 6.5 22H20v-5" /></>,
  community: <><Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><Circle cx="9" cy="7" r="4" /><Path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  swap: <><Path d="M21 4v6h-6M3 20v-6h6" /><Path d="M5.5 9a8 8 0 0 1 13.2-3L21 10M3 14l2.3 4A8 8 0 0 0 18.5 15" /></>,
  check: <Path d="M20 6 9 17l-5-5" />,
  plus: <Path d="M12 5v14M5 12h14" />,
  minus: <Path d="M5 12h14" />,
  back: <Path d="m15 18-6-6 6-6" />,
  share: <Path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v13" />,
  camera: <><Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><Circle cx="12" cy="13" r="4" /></>,
  close: <Path d="M18 6 6 18M6 6l12 12" />,
  pot: <Path d="M3 11h18M5 11v6a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-6M9 7c0-1 .5-2 1.5-2M14 7c0-1 .5-2 1.5-2" />,
  kid: <><Circle cx="12" cy="7" r="3.5" /><Path d="M5.5 21a6.5 6.5 0 0 1 13 0" /></>,
  coin: <><Circle cx="12" cy="12" r="9" /><Path d="M15 9.5c-.6-1-1.7-1.5-3-1.5-1.7 0-3 .9-3 2s1.3 1.7 3 2 3 .9 3 2-1.3 2-3 2c-1.3 0-2.4-.5-3-1.5M12 6.5v11" /></>,
  clock: <><Circle cx="12" cy="12" r="9" /><Path d="M12 7v5l3 2" /></>,
  alert: <><Circle cx="12" cy="12" r="9" /><Path d="M12 8v4M12 16h.01" /></>,
  menu: <Path d="M4 7h16M4 12h16M4 17h10" />,
  home: <Path d="M3 11.5 12 4l9 7.5M5.5 10v9.5h13V10" />,
  feed: <><Rect x="3" y="3" width="18" height="18" rx="5" /><Circle cx="12" cy="12" r="4" /><Circle cx="17.5" cy="6.5" r="0.6" /></>,
  heart: <Path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21.2l8.8-8.8a5.5 5.5 0 0 0 0-7.8z" />,
  chat: <Path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-4-.9L3 21l1.9-4.5A8.4 8.4 0 1 1 21 11.5z" />,
  save: <Path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />,
  gear: <><Circle cx="12" cy="12" r="3" /><Path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></>,
  globe: <><Circle cx="12" cy="12" r="9" /><Path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>,
  logout: <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />,
  users: <><Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><Circle cx="9" cy="7" r="4" /><Path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  book: <><Path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z" /><Path d="M6.5 17A2.5 2.5 0 0 0 4 19.5 2.5 2.5 0 0 0 6.5 22H20v-5" /></>,
};

export function Icon({ name, c = 'ink', size = 22, w = 1.9, flip }) {
  const { rtl } = useStore();
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color[c] || c} strokeWidth={w}
      strokeLinecap="round" strokeLinejoin="round" style={flip && rtl ? { transform: [{ scaleX: -1 }] } : null}>
      {ICONS[name]}
    </Svg>
  );
}

export function Screen({ children, scroll = true, footer }) {
  const Body = scroll ? ScrollView : View;
  return (
    <View style={s.screen}>
      <View pointerEvents="none" style={s.glowWrap}>
        <View style={[s.glow, { backgroundColor: color.glowPink, right: -90, top: -150 }]} />
        <View style={[s.glow, { backgroundColor: color.glowGreen, left: -110, top: -120 }]} />
      </View>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <Body style={{ flex: 1 }} contentContainerStyle={scroll ? s.content : undefined} keyboardShouldPersistTaps="handled">
          {scroll ? children : <View style={[s.content, { flex: 1 }]}>{children}</View>}
        </Body>
        {footer ? <View style={s.footer}>{footer}</View> : null}
      </SafeAreaView>
    </View>
  );
}

export function MenuButton() {
  const { openMenu } = useNav();
  const { t } = useStore();
  if (!openMenu) return null;
  return <RoundButton icon="menu" label={t('menu')} onPress={openMenu} />;
}

export function Header({ title, sub, right, menu = true }) {
  return (
    <View style={{ gap: 4, marginBottom: 4 }}>
      <View style={[s.row, { gap: 12 }]}>
        {menu ? <MenuButton /> : null}
        <T v="display" style={{ flex: 1 }}>{title}</T>
        {right}
      </View>
      {sub ? <T c="muted">{sub}</T> : null}
    </View>
  );
}

export const Card = ({ style, children }) => <View style={[s.card, style]}>{children}</View>;
export const Row = ({ style, children, gap = 8 }) => <View style={[s.row, { gap }, style]}>{children}</View>;

export function Button({ label, onPress, kind = 'primary', style, icon }) {
  const primary = kind === 'primary';
  return (
    <Pressable accessibilityRole="button" onPress={onPress}
      style={({ pressed }) => [s.btn, { backgroundColor: primary ? color.accent : color.accentSoft, opacity: pressed ? 0.85 : 1 }, style]}>
      {icon ? <Icon name={icon} c={primary ? 'onAccent' : 'accent'} size={18} /> : null}
      <T v="bodyStrong" c={primary ? 'onAccent' : 'accent'} center>{label}</T>
    </Pressable>
  );
}

export function Pill({ label, onPress, active, c = 'accent', soft = 'accentSoft' }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: !!active }} onPress={onPress}
      style={[s.pill, active ? { backgroundColor: color[soft], borderColor: 'transparent' } : null]}>
      <T v="label" c={active ? c : 'muted'} center style={{ fontFamily: font.medium }}>{label}</T>
    </Pressable>
  );
}

export function Tag({ k }) {
  const { t } = useStore();
  const [fg, bg] = tagColor[k];
  return <View style={[s.tag, { backgroundColor: bg }]}><T v="label" c={fg} center>{t('tag_' + k)}</T></View>;
}

export function RoundButton({ icon, onPress, c = 'ink', bg = 'surface', size = 40, label, flip }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={6}
      style={({ pressed }) => [{ width: size, height: size, borderRadius: size / 2, backgroundColor: color[bg], alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 }]}>
      <Icon name={icon} c={c} size={size * 0.5} flip={flip} />
    </Pressable>
  );
}

export function Stepper({ value, onChange, min = 1, max = 12 }) {
  const { t } = useStore();
  return (
    <View style={[s.row, s.stepper]}>
      <RoundButton icon="minus" size={32} bg="bg" label={t('fewer')} onPress={() => onChange(Math.max(min, value - 1))} />
      <T v="heading" center style={{ minWidth: 28 }}>{value}</T>
      <RoundButton icon="plus" size={32} bg="bg" label={t('more')} onPress={() => onChange(Math.min(max, value + 1))} />
    </View>
  );
}

export function Checkbox({ checked }) {
  return (
    <View style={[s.check, checked ? { backgroundColor: color.accent, borderColor: color.accent } : null]}>
      {checked ? <Icon name="check" c="onAccent" size={14} w={3} /> : null}
    </View>
  );
}

export function Field({ label, error, style, inputStyle, ...input }) {
  const { rtl } = useStore();
  return (
    <View style={[{ gap: 6 }, style]}>
      {label ? <T v="label" c="muted">{label}</T> : null}
      <TextInput placeholderTextColor={color.muted}
        style={[s.input, { textAlign: rtl ? 'right' : 'left' }, error ? s.inputError : null, inputStyle]} {...input} />
      {error ? <T v="caption" c="error">{error}</T> : null}
    </View>
  );
}

export function TabBar({ tab, onTab }) {
  const { t } = useStore();
  const tabs = [['home', 'home'], ['week', 'tab_week'], ['feed', 'feed'], ['shop', 'tab_shop']];
  return (
    <SafeAreaView edges={['bottom']} style={s.tabbar}>
      <View style={s.row}>
        {tabs.map(([k, label]) => {
          const on = k === tab;
          return (
            <Pressable key={k} accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={() => onTab(k)} style={s.tab}>
              <Icon name={k} c={on ? 'accent' : 'muted'} size={24} w={on ? 2.2 : 1.8} />
              <T v="label" c={on ? 'accent' : 'muted'} center style={on ? { fontFamily: font.medium } : null}>{t(label)}</T>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

export function Avatar({ letter, fg = 'kids', bg = 'kidsSoft', size = 44, ring }) {
  const inner = (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color[bg] || bg, alignItems: 'center', justifyContent: 'center' }}>
      <T v={size > 50 ? 'title' : 'heading'} c={fg} center>{(letter || '?').toUpperCase()}</T>
    </View>
  );
  if (!ring) return inner;
  return (
    <View style={{ padding: 2.5, borderRadius: size, borderWidth: 2.5, borderColor: color.kids, borderEndColor: color.accent, borderBottomColor: color.accent }}>{inner}</View>
  );
}

export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  glowWrap: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  glow: { position: 'absolute', width: 320, height: 320, borderRadius: 160, opacity: 0.75 },
  content: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 28, gap: 16 },
  footer: { paddingHorizontal: 22, paddingBottom: 12, paddingTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center' },
  card: { backgroundColor: color.surface, borderRadius: radius.card, padding: 16, gap: 10, ...shadow },
  btn: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, paddingVertical: 15, paddingHorizontal: 22 },
  pill: { borderRadius: radius.pill, borderWidth: 1, borderColor: color.line, backgroundColor: color.surface, paddingVertical: 7, paddingHorizontal: 14 },
  tag: { borderRadius: radius.pill, paddingVertical: 3, paddingHorizontal: 10 },
  stepper: { gap: 4, padding: 4, borderRadius: radius.pill, backgroundColor: color.surface, borderWidth: 1, borderColor: color.line },
  check: { width: 24, height: 24, borderRadius: 8, borderWidth: 1.5, borderColor: color.line, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center' },
  input: { ...type.body, color: color.ink, backgroundColor: color.surface, borderWidth: 1, borderColor: color.line, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12 },
  inputError: { borderColor: color.error, borderWidth: 1.5, backgroundColor: color.errorSoft },
  tabbar: { backgroundColor: color.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 8, ...shadow, shadowOffset: { width: 0, height: -4 } },
  tab: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 4 },
});
