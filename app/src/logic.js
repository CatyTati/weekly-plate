// Pure app logic (no React): translation helpers, quantities, cost,
// weekly planner, shopping list and recipe validation.
// Kept free of React Native imports so it runs under plain Node tests.
import { S, DAYS, AISLES, AISLE_ORDER, TAG_KEYS, U, UNITS, UNIT_T, ING, R, COOKS } from './data.js';
import { STRINGS2 } from './strings2.js';
import { POSTS } from './feed.js';

export { DAYS, AISLES, AISLE_ORDER, TAG_KEYS, U, UNITS, R, COOKS, POSTS };

export const LANGS = [
  { k: 'he', label: 'עברית', rtl: true, locale: 'he-IL' },
  { k: 'en', label: 'English', rtl: false, locale: 'en-US' },
  { k: 'ru', label: 'Русский', rtl: false, locale: 'ru-RU' },
];

// Extra strings used only by the app (the rest come from the prototype).
const EXTRA = {
  he: { obStep: 'שלב 1 מתוך 2', obTitle: 'מה חשוב אצלכם בבית?', obSub: 'אפשר לבחור כמה. נתאים את התכנון אליכם.', obBuild: 'בנו לי שבוע',
        sub_kids: 'מנות שילדים באמת אוכלים', sub_budget: 'ארוחות טעימות במחיר שפוי', sub_prep: 'בישול אחד גדול ביום ראשון', sub_quick: 'ערבי חול מהירים',
        yourWeek: 'השבוע שלכם', people: '{n} סועדים', left: 'נשארו {b}', openPrep: 'לתכנון הבישול הגדול', back: 'חזרה', cancel: 'ביטול', addToWeek: 'הוספה לשבוע', pickDay: 'לאיזה יום?',
        sendList: 'שליחת הרשימה', newRecipe: 'מתכון חדש', addRecipe: 'הוספת מתכון', perPortion: 'למנה', byCook: 'מאת {n}', settings: 'הגדרות', photoPerm: 'צריך הרשאה לגלריה כדי להוסיף תמונות.' },
  en: { obStep: 'Step 1 of 2', obTitle: 'What matters in your home?', obSub: 'Pick any. We’ll tailor the plan to you.', obBuild: 'Build my week',
        sub_kids: 'Dishes kids actually eat', sub_budget: 'Tasty meals at a fair price', sub_prep: 'One big cook on Sunday', sub_quick: 'Quick weeknights',
        yourWeek: 'Your week', people: '{n} people', left: '{b} left', openPrep: 'Plan the big cook', back: 'Back', cancel: 'Cancel', addToWeek: 'Add to week', pickDay: 'Which day?',
        sendList: 'Send the list', newRecipe: 'New recipe', addRecipe: 'Add a recipe', perPortion: 'per serving', byCook: 'by {n}', settings: 'Settings', photoPerm: 'Allow photo access to add pictures.' },
  ru: { obStep: 'Шаг 1 из 2', obTitle: 'Что важно в вашей семье?', obSub: 'Можно выбрать несколько. Подстроим меню под вас.', obBuild: 'Составить меню',
        sub_kids: 'Блюда, которые дети едят', sub_budget: 'Вкусно и недорого', sub_prep: 'Одна большая готовка в воскресенье', sub_quick: 'Быстрые будние ужины',
        yourWeek: 'Ваша неделя', people: '{n} чел.', left: 'осталось {b}', openPrep: 'План большой готовки', back: 'Назад', cancel: 'Отмена', addToWeek: 'В неделю', pickDay: 'На какой день?',
        sendList: 'Отправить список', newRecipe: 'Новый рецепт', addRecipe: 'Добавить рецепт', perPortion: 'за порцию', byCook: '{n}', settings: 'Настройки', photoPerm: 'Разрешите доступ к фото, чтобы добавить снимки.' },
};

export function makeT(lang) {
  const table = { ...S.he, ...EXTRA.he, ...STRINGS2.he, ...S[lang], ...EXTRA[lang], ...STRINGS2[lang] };
  return (key, vars) => {
    let s = table[key] != null ? String(table[key]) : key;
    if (vars) for (const k in vars) s = s.split('{' + k + '}').join(vars[k]);
    return s;
  };
}

export const pick = (x, lang) => (x == null ? '' : typeof x === 'string' ? x : x[lang] || x.he);
export const localeOf = lang => (LANGS.find(l => l.k === lang) || LANGS[0]).locale;
export const isRtl = lang => (LANGS.find(l => l.k === lang) || LANGS[0]).rtl;
export const num = (n, lang) => Number(n).toLocaleString(localeOf(lang));
export const money = (n, lang) => '₪' + num(Math.round(n), lang);
export const unitName = (u, lang) => (lang === 'he' ? u : (UNIT_T[lang] || {})[u] || u);
export const ingName = (n, lang) => (lang === 'he' ? n : ING[n] ? ING[n][lang === 'en' ? 0 : 1] : n);
export const dayName = (d, lang) => DAYS[lang][d];
export const aisleName = (a, lang) => AISLES[lang][a];

export function roundQty(q, u) {
  if (u === 'גרם') return Math.max(50, Math.round(q / 50) * 50);
  if (u === 'מ״ל') return Math.max(10, Math.round(q / 10) * 10);
  if (['כוס', 'כף', 'כפית', 'ק״ג'].includes(u)) return Math.round(q * 2) / 2 || 0.5;
  return Math.ceil(q - 1e-9);
}
export function fmtQty(q, u, lang) {
  const r = roundQty(q, u);
  if (u === 'גרם' && r >= 1000) return num(r / 1000, lang) + ' ' + unitName('ק״ג', lang);
  return num(r, lang) + ' ' + unitName(u, lang);
}

export const factor = servings => servings / 4;
export const hasPrice = r => r.ing.some(i => i[4] > 0);
export const cost = (r, servings) => r.ing.reduce((s, i) => s + i[1] * i[4] * factor(servings), 0);

/* ---------- planner (same rules as the backend) ---------- */
export function score(r, day, modes, rand) {
  let s = rand() * 1.5;
  if (modes.kids && r.tags.includes('kids')) s += 2;
  if (modes.budget && hasPrice(r) && cost(r, 4) / 4 <= 12) s += 2;
  if (modes.quick && day <= 4) s += r.time <= 20 ? 2.5 : r.time <= 30 ? 1 : -1.5;
  if (modes.prep && r.tags.includes('prep')) s += day <= 3 ? 2 : 1;
  return s;
}
function best(recipes, day, modes, used, rand) {
  let id = null, top = -Infinity;
  for (const r of recipes) {
    if (used.has(r.id)) continue;
    const s = score(r, day, modes, rand);
    if (s > top) { top = s; id = r.id; }
  }
  return id;
}
export function planWeek(recipes, modes, rand = Math.random) {
  const used = new Set();
  const plan = [];
  for (let d = 0; d < 7; d++) { const id = best(recipes, d, modes, used, rand); plan.push(id); if (id) used.add(id); }
  return plan;
}
export function swapDay(plan, day, recipes, modes, rand = Math.random) {
  const id = best(recipes, day, modes, new Set(plan.filter(Boolean)), rand);
  const next = plan.slice();
  if (id) next[day] = id;
  return next;
}

/* ---------- shopping list ---------- */
export function shoppingList(recipes, servings) {
  const map = {};
  for (const r of recipes) for (const [n, q, u, a] of r.ing) {
    const k = n + '|' + u;
    if (!map[k]) map[k] = { key: k, n, u, a, q: 0 };
    map[k].q += q * factor(servings);
  }
  return Object.values(map);
}
export function listText(items, lang, t) {
  let s = t('listTitle', { app: t('app') }) + '\n';
  for (const a of AISLE_ORDER) {
    const l = items.filter(i => i.a === a);
    if (!l.length) continue;
    s += '\n' + aisleName(a, lang) + '\n' + l.map(i => '• ' + ingName(i.n, lang) + ' – ' + fmtQty(i.q, i.u, lang)).join('\n') + '\n';
  }
  return s;
}

/* ---------- validation (same limits as the backend) ---------- */
export const LIMITS = { nameMin: 2, nameMax: 60, timeMin: 5, timeMax: 240, ingMin: 2, ingMax: 30, stepsMin: 15, photos: 3 };
const names = r => (typeof r.name === 'string' ? [r.name] : Object.values(r.name));

/** Returns { errors: {field: message}, first: fieldKey | null, value: cleaned recipe | null } */
export function validateRecipe(form, existing, t) {
  const errors = {};
  const name = (form.name || '').trim();
  if (!name) errors.name = t('eNameReq');
  else if (name.length < LIMITS.nameMin) errors.name = t('eNameShort');
  else if (existing.some(r => names(r).some(x => x.toLowerCase() === name.toLowerCase()))) errors.name = t('eNameDup');

  const tv = String(form.time ?? '').trim(), tn = Number(tv);
  if (!tv) errors.time = t('eTimeReq');
  else if (!Number.isInteger(tn) || tn < LIMITS.timeMin || tn > LIMITS.timeMax) errors.time = t('eTimeRange');

  const rows = form.ing || [];
  const bad = rows.findIndex(r => (r.n.trim() && !(Number(r.q) > 0)) || (!r.n.trim() && String(r.q).trim() !== ''));
  const full = rows.filter(r => r.n.trim() && Number(r.q) > 0);
  if (bad >= 0) { const r = rows[bad]; errors['ing.' + bad] = !r.n.trim() ? t('eIngNoName', { i: bad + 1 }) : t('eIngNoQty', { n: r.n.trim() }); }
  else if (full.length < LIMITS.ingMin) errors.ing = t('eIngMin');

  const steps = (form.steps || '').trim();
  if (!steps) errors.steps = t('eStepsReq');
  else if (steps.length < LIMITS.stepsMin) errors.steps = t('eStepsShort');

  const order = ['name', 'time', ...Object.keys(errors).filter(k => k.startsWith('ing')), 'steps'];
  const first = order.find(k => errors[k]) || null;
  if (first) return { errors, first, value: null };
  const tags = TAG_KEYS.filter(k => form.tags?.[k]);
  return {
    errors, first: null,
    value: {
      id: 'c' + Date.now(), name, time: tn, m: 'stove', tags, custom: true,
      ing: full.map(r => [r.n.trim(), Number(r.q), r.u, r.a, 0]),
      steps, photos: (form.photos || []).slice(0, LIMITS.photos),
      kid: tags.includes('kids') && form.kid?.trim() ? form.kid.trim() : undefined,
      keep: tags.includes('prep') ? 3 : 0,
    },
  };
}

/* ---------- big cook plan ---------- */
export function prepPlan(recipes, servings) {
  const rs = [...new Set(recipes.filter(r => r.tags.includes('prep')))];
  const chop = {};
  for (const r of rs) for (const [n, q, u, a] of r.ing) if (a === 'veg') { const k = n + '|' + u; chop[k] = chop[k] || { n, u, q: 0 }; chop[k].q += q * factor(servings); }
  const oven = rs.filter(r => r.m === 'oven'), stove = rs.filter(r => r.m !== 'oven');
  const minutes = Math.max(0, ...oven.map(r => r.time)) + stove.reduce((s, r) => s + r.time * 0.7, 0) + 20;
  return { recipes: rs, chop: Object.values(chop), oven, stove, hours: Math.round(minutes / 30) / 2 };
}

export function weekRangeLabel(start, lang) {
  const end = new Date(start); end.setDate(end.getDate() + 6);
  const f = new Intl.DateTimeFormat(localeOf(lang), { day: 'numeric', month: 'short' });
  return f.format(start) + ' – ' + f.format(end);
}
export function thisSunday(now = new Date()) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  d.setDate(d.getDate() - d.getDay());
  return d;
}

/* ---------- accounts ---------- */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PASS_MIN = 8;
export function validateSignIn({ email, password }, t) {
  const errors = {};
  if (!EMAIL.test((email || '').trim())) errors.email = t('eEmail');
  if (!password) errors.password = t('ePassReq');
  return errors;
}
export function validateSignUp({ name, email, password, terms }, t) {
  const errors = {};
  if (!(name || '').trim()) errors.name = t('eName');
  if (!EMAIL.test((email || '').trim())) errors.email = t('eEmail');
  if (!password) errors.password = t('ePassReq');
  else if (password.length < PASS_MIN) errors.password = t('ePass');
  if (!terms) errors.terms = t('eTerms');
  return errors;
}
export const validateEmail = (email, t) => (EMAIL.test((email || '').trim()) ? null : t('eEmail'));

/* ---------- home & feed ---------- */
export function greetingKey(hour) {
  return hour < 12 ? 'goodMorning' : hour < 17 ? 'goodAfternoon' : 'goodEvening';
}
export function timeAgo(hours, t) {
  if (hours < 24) return t('hoursAgo', { n: Math.max(1, Math.round(hours)) });
  const d = Math.floor(hours / 24);
  return d === 1 ? t('yesterday') : t('daysAgo', { n: d });
}
/** Posts from followed cooks, newest first; optionally only one cook. */
export function feedFor(following, onlyCook = null, posts = POSTS) {
  return posts
    .filter(p => following.includes(p.cook) && (!onlyCook || p.cook === onlyCook))
    .sort((a, b) => a.hours - b.hours);
}
export const firstName = user => ((user?.name || user?.email || '').trim().split(/[\s@]/)[0] || '');
