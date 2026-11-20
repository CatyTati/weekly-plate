// Design tokens from the Figma file "Weekly Plate – App Design".
const light = {
  bg: '#FAF7F6',
  surface: '#FFFFFF',
  ink: '#3A3340',
  muted: '#8F8792',
  line: '#EEE8EA',
  accent: '#A3546F', // old rose
  onAccent: '#FFFFFF',
  accentSoft: '#F7E8EE',
  kids: '#2E7D7A', // teal, so the kids tag doesn't look like the accent
  kidsSoft: '#E3F2F1',
  budget: '#9C7631',
  budgetSoft: '#F8F0DF',
  quick: '#6A79B0',
  quickSoft: '#EDF0FA',
  error: '#B3261E', // deeper than the accent, so delete never looks like a main button
  errorSoft: '#FCE8E6',
  glowPink: '#F9DDE5',
  glowGreen: '#F4E4EC', // soft glow behind the top of each screen
  plate: '#F6E3DA',
  plateDot: '#E59A86',
  field: '#FFFFFF', // text inputs
  edge: '#F1ECEE', // thin outline on cards and the tab bar
};

// The same roles for dark mode: soft backgrounds go dark, text and accents go light.
const dark = {
  bg: '#151317',
  surface: '#211E24',
  ink: '#F1EDF2',
  muted: '#A49CA8',
  line: '#37313A',
  accent: '#E79AB5',
  onAccent: '#3A1424',
  accentSoft: '#3A2330',
  kids: '#7FD1CB',
  kidsSoft: '#1D3533',
  budget: '#DDB566',
  budgetSoft: '#3A3020',
  quick: '#A3B0E3',
  quickSoft: '#272C42',
  error: '#FF6B6B',
  errorSoft: '#3D1C1E',
  glowPink: '#2E1C26',
  glowGreen: '#2A1A24',
  plate: '#3A2A27',
  plateDot: '#B9705E',
  field: '#18151B',
  edge: '#302A34',
};

// Screens read `color` while they render, so switching the palette and
// re-rendering every screen is enough to change the theme.
export const color = { ...light };
export const tagColor = {};
const makeTags = () => ({
  kids: [color.kids, color.kidsSoft],
  budget: [color.budget, color.budgetSoft],
  quick: [color.quick, color.quickSoft],
  prep: [color.accent, color.accentSoft],
});
Object.assign(tagColor, makeTags());

let isDark = false;
const listeners = [];
/** Styles made once at load call this to be made again for the new palette. */
export const onThemeChange = fn => { listeners.push(fn); fn(); };
export function applyTheme(darkMode) {
  if (darkMode === isDark) return;
  isDark = darkMode;
  Object.assign(color, darkMode ? dark : light);
  Object.assign(tagColor, makeTags());
  listeners.forEach(fn => fn());
}

export const font = {
  light: 'Rubik_300Light',
  regular: 'Rubik_400Regular',
  medium: 'Rubik_500Medium',
};

export const type = {
  display: { fontFamily: font.medium, fontSize: 30, lineHeight: 38 },
  title: { fontFamily: font.medium, fontSize: 22, lineHeight: 30 },
  heading: { fontFamily: font.medium, fontSize: 17, lineHeight: 24 },
  bodyStrong: { fontFamily: font.medium, fontSize: 15, lineHeight: 22 },
  body: { fontFamily: font.regular, fontSize: 15, lineHeight: 23 },
  caption: { fontFamily: font.regular, fontSize: 13, lineHeight: 19 },
  label: { fontFamily: font.regular, fontSize: 12, lineHeight: 16 },
};

export const radius = { sm: 10, md: 14, card: 22, pill: 999 };

export const shadow = {
  shadowColor: '#5C485C',
  shadowOpacity: 0.07,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 6 },
  elevation: 2,
};
