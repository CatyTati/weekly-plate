// Design tokens from the Figma file "Weekly Plate – App Design".
export const color = {
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
};

export const tagColor = {
  kids: [color.kids, color.kidsSoft],
  budget: [color.budget, color.budgetSoft],
  quick: [color.quick, color.quickSoft],
  prep: [color.accent, color.accentSoft],
};

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
