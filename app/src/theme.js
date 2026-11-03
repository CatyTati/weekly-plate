// Design tokens from the Figma file "Weekly Plate – App Design".
const light = {
  bg: '#FAF7F6',
  surface: '#FFFFFF',
  ink: '#3A3340',
  muted: '#8F8792',
  line: '#EEE8EA',
  accent: '#557F66',
  onAccent: '#FFFFFF',
  accentSoft: '#EAF2EC',
  kids: '#B0647E',
  kidsSoft: '#F9ECF0',
  budget: '#9C7631',
  budgetSoft: '#F8F0DF',
  quick: '#6A79B0',
  quickSoft: '#EDF0FA',
  error: '#B0574A',
  errorSoft: '#FBEDEA',
  glowPink: '#F9DDE5',
  glowGreen: '#DCEDE1',
  plate: '#F6E3DA',
  plateDot: '#E59A86',
};

// The same roles for dark mode: soft backgrounds go dark, text and accents go light.
const dark = {
  bg: '#151317',
  surface: '#211E24',
  ink: '#F1EDF2',
  muted: '#A49CA8',
  line: '#37313A',
  accent: '#7DB08F',
  onAccent: '#11201A',
  accentSoft: '#233529',
  kids: '#E393AE',
  kidsSoft: '#3B2430',
  budget: '#DDB566',
  budgetSoft: '#3A3020',
  quick: '#A3B0E3',
  quickSoft: '#272C42',
  error: '#EC8B7E',
  errorSoft: '#3F2623',
  glowPink: '#2E1C26',
  glowGreen: '#1A2B21',
  plate: '#3A2A27',
  plateDot: '#B9705E',
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
