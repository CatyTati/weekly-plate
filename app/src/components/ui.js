// Shared UI pieces that match the Figma components.
// Direction: the root view sets `direction: 'rtl'` for Hebrew, which mirrors
// every row. Under that direction 'left' means the start of the line, so 'left'
// puts Hebrew on the right and 'right' would put it on the left. TextInput doesn't
// swap like this, so Field still asks for 'right'.
import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, font, onThemeChange, radius, shadow, tagColor, type } from '../theme';
import { useStore } from '../store';
import { useNav } from '../nav';

export function T({ v = 'body', c = 'ink', center, style, children, ...rest }) {
  const { rtl } = useStore();
  return (
    <Text
      style={[type[v], { color: color[c] || c, textAlign: center ? 'center' : 'left', writingDirection: rtl ? 'rtl' : 'ltr' }, style]}
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
  eye: <><Path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><Circle cx="12" cy="12" r="3" /></>,
  eyeOff: <><Path d="M10.6 5.1A9.7 9.7 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.2M6.6 6.6A17.4 17.4 0 0 0 2 12s3.6 7 10 7a9.6 9.6 0 0 0 5.4-1.6" /><Path d="M3 3l18 18M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>,
  trash: <Path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" />,
  back: <Path d="m15 18-6-6 6-6" />,
  next: <Path d="m9 18 6-6-6-6" />,
  down: <Path d="m6 9 6 6 6-6" />,
  pencil: <Path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4zM13.5 6.5l4 4" />,
  userCheck: <><Circle cx="9" cy="7" r="4" /><Path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2M16 11l2 2 4-4" /></>,
  lock: <><Rect x="5" y="11" width="14" height="10" rx="2" /><Path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
  search: <><Circle cx="11" cy="11" r="7" /><Path d="m20 20-3.5-3.5" /></>,
  more: <><Circle cx="5" cy="12" r="1.2" /><Circle cx="12" cy="12" r="1.2" /><Circle cx="19" cy="12" r="1.2" /></>,
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

/** A line icon. `filled` paints the inside too, as for a liked heart. */
export function Icon({ name, c = 'ink', size = 22, w = 1.9, flip, filled }) {
  const { rtl } = useStore();
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color[c] || c : 'none'} stroke={color[c] || c} strokeWidth={w}
      strokeLinecap="round" strokeLinejoin="round" style={flip && rtl ? { transform: [{ scaleX: -1 }] } : null}>
      {ICONS[name]}
    </Svg>
  );
}

export function Screen({ children, scroll = true, header, footer, scrollRef, refreshControl }) {
  const Body = scroll ? ScrollView : View;
  const own = useRef(null);
  const ref = scrollRef || own;
  const offset = useRef(0); // how far the page is scrolled
  // When the keyboard opens, the page gets shorter. Scroll so the field being typed in is in view.
  useEffect(() => {
    if (!scroll) return undefined;
    const sub = Keyboard.addListener('keyboardDidShow', () => setTimeout(() => {
      const input = TextInput.State.currentlyFocusedInput?.();
      const page = ref.current;
      if (!input?.measureInWindow || !page?.measureInWindow) return;
      input.measureInWindow((ix, iy, iw, ih) => page.measureInWindow((px, py, pw, ph) => {
        const below = iy + ih + 16 - (py + ph); // hidden under the bottom of the page
        const above = py + 16 - iy; // hidden above the top
        if (below > 0) page.scrollTo({ y: offset.current + below, animated: true });
        else if (above > 0) page.scrollTo({ y: Math.max(0, offset.current - above), animated: true });
      }));
    }, 50));
    return () => sub.remove();
  }, [scroll, ref]);
  return (
    <View style={s.screen}>
      <View pointerEvents="none" style={s.glowWrap}>
        <View style={[s.glow, { backgroundColor: color.glowPink, right: -90, top: -150 }]} />
        <View style={[s.glow, { backgroundColor: color.glowGreen, left: -110, top: -120 }]} />
      </View>
      {/* The keyboard pushes the footer up and shrinks the page, and the page scrolls to the field being typed in. */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          {header ? <View style={s.header}>{header}</View> : null}
          <Body ref={scroll ? ref : undefined} style={{ flex: 1 }} contentContainerStyle={scroll ? s.content : undefined}
            keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" refreshControl={scroll ? refreshControl : undefined}
            onScroll={scroll ? e => { offset.current = e.nativeEvent.contentOffset.y; } : undefined} scrollEventThrottle={16}>
            {scroll ? children : <View style={[s.content, { flex: 1 }]}>{children}</View>}
          </Body>
          {footer ? <View style={s.footer}>{footer}</View> : null}
        </SafeAreaView>
      </KeyboardAvoidingView>
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

export function Button({ label, onPress, kind = 'primary', style, icon, disabled }) {
  const primary = kind === 'primary';
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!disabled }} onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [s.btn, { backgroundColor: primary ? color.accent : color.accentSoft, opacity: disabled ? 0.4 : pressed ? 0.85 : 1 }, style]}>
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

/** A text box with an optional label and error. A password box gets an eye button to show what was typed. */
export function Field({ label, error, style, inputStyle, secureTextEntry, ...input }) {
  const { rtl, t } = useStore();
  const [shown, setShown] = useState(false);
  return (
    <View style={[{ gap: 6 }, style]}>
      {label ? <T v="label" c="muted">{label}</T> : null}
      <View>
        <TextInput placeholderTextColor={color.muted} secureTextEntry={secureTextEntry && !shown}
          style={[s.input, { textAlign: rtl ? 'right' : 'left' }, secureTextEntry ? { paddingEnd: 48 } : null, error ? s.inputError : null, inputStyle]} {...input} />
        {secureTextEntry ? (
          <Pressable onPress={() => setShown(v => !v)} hitSlop={8} accessibilityRole="button" accessibilityLabel={t(shown ? 'hidePass' : 'showPass')}
            style={{ position: 'absolute', end: 4, top: 0, bottom: 0, width: 44, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={shown ? 'eyeOff' : 'eye'} c="muted" size={20} />
          </Pressable>
        ) : null}
      </View>
      {error ? <T v="caption" c="error">{error}</T> : null}
    </View>
  );
}

/** A centered "are you sure?" box. `danger` makes the confirm button red. */
export function ConfirmDialog({ title, message, confirmLabel, cancelLabel, danger, onConfirm, onCancel }) {
  const { t, rtl } = useStore();
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
      <View style={{ flex: 1, justifyContent: 'center', padding: 28, direction: rtl ? 'rtl' : 'ltr' }}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.45)' }]} accessibilityLabel={t('cancel')} onPress={onCancel} />
        <View accessibilityViewIsModal style={{ backgroundColor: color.surface, borderRadius: 24, padding: 22, gap: 8, ...shadow }}>
          <T v="title" center>{title}</T>
          {message ? <T c="muted" center>{message}</T> : null}
          <View style={{ gap: 8, marginTop: 10 }}>
            <Pressable accessibilityRole="button" onPress={onConfirm}
              style={({ pressed }) => [s.btn, { backgroundColor: danger ? color.error : color.accent, opacity: pressed ? 0.85 : 1 }]}>
              <T v="bodyStrong" c="onAccent" center>{confirmLabel}</T>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={onCancel}
              style={({ pressed }) => [s.btn, { backgroundColor: color.bg, opacity: pressed ? 0.85 : 1 }]}>
              <T v="bodyStrong" c="muted" center>{cancelLabel || t('cancel')}</T>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/**
 * "Copied from …" on one of your recipes, or "Copied from you" on someone's copy of yours.
 * Only you, and the cook it came from, ever see it.
 */
export function CopiedNote({ recipe }) {
  const { t } = useStore();
  if (!recipe?.copiedFrom && !recipe?.copiedFromMe) return null;
  const name = recipe.copiedFromName || recipe.ownerName;
  const text = recipe.copiedFromMe ? t('copiedFromYou') : name ? t('copiedNote', { n: name }) : t('copiedNoteAnon');
  return (
    <Row gap={6} style={{ alignSelf: 'flex-start', backgroundColor: color.quickSoft, borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: 10 }}>
      <Icon name="users" c="quick" size={14} />
      <T v="label" c="quick">{text}</T>
    </Row>
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
              <View style={{ paddingHorizontal: 18, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: on ? color.accentSoft : 'transparent' }}>
                <Icon name={k} c={on ? 'accent' : 'muted'} size={22} w={on ? 2.2 : 1.8} />
              </View>
              <T v="label" c={on ? 'accent' : 'muted'} center style={on ? { fontFamily: font.medium } : null}>{t(label)}</T>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

export function Avatar({ letter, fg = 'accent', bg = 'accentSoft', size = 44, ring }) {
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

export let s;
const makeStyles = () => StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  glowWrap: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  glow: { position: 'absolute', width: 320, height: 320, borderRadius: 160, opacity: 0.75 },
  content: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 28, gap: 16 },
  header: { paddingHorizontal: 22, paddingTop: 8 },
  footer: { paddingHorizontal: 22, paddingBottom: 12, paddingTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center' },
  card: { backgroundColor: color.surface, borderRadius: radius.card, padding: 16, gap: 10, borderWidth: 1, borderColor: color.edge, ...shadow },
  btn: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, paddingVertical: 15, paddingHorizontal: 22 },
  pill: { borderRadius: radius.pill, borderWidth: 1, borderColor: color.line, backgroundColor: color.surface, paddingVertical: 7, paddingHorizontal: 14 },
  tag: { borderRadius: radius.pill, paddingVertical: 3, paddingHorizontal: 10 },
  stepper: { gap: 4, padding: 4, borderRadius: radius.pill, backgroundColor: color.surface, borderWidth: 1, borderColor: color.line },
  check: { width: 24, height: 24, borderRadius: 8, borderWidth: 1.5, borderColor: color.line, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center' },
  // No lineHeight: on iOS it pushes a single-line input's text down and cuts it off.
  input: { fontFamily: type.body.fontFamily, fontSize: type.body.fontSize, color: color.ink, backgroundColor: color.field, borderWidth: 1, borderColor: color.line, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12 },
  inputError: { borderColor: color.error, borderWidth: 1.5, backgroundColor: color.errorSoft },
  tabbar: { backgroundColor: color.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 8, borderWidth: 1, borderBottomWidth: 0, borderColor: color.edge, ...shadow, shadowOffset: { width: 0, height: -4 } },
  tab: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 4 },
});
onThemeChange(() => { s = makeStyles(); });

