// Calories and nutrition from the foods database. Pure logic, so it runs under plain Node tests.
// A food: { id, names: { he: [...], en: [...], ru: [...] }, aisle, kcal, protein, carbs, fat, piece_g, density, status }.
// Values are per 100 g. Recipe amounts are kept for 4 people.

/** Lower case, no Hebrew vowel marks or punctuation, single spaces. */
export function normalize(s) {
  return String(s || '').toLowerCase()
    .replace(/[֑-ׇ]/g, '')            // niqqud and cantillation
    .replace(/[׳'"״`’]/g, '')
    .replace(/ё/g, 'е')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ').trim();
}

// One word without a plural ending or the Hebrew "ה" prefix, so "העגבניות" and "עגבנייה" meet.
function stem(w) {
  if (/[֐-׿]/.test(w)) {
    let x = w.length > 3 && w[0] === 'ה' ? w.slice(1) : w;
    if (x.length > 3 && (x.endsWith('ים') || x.endsWith('ות'))) x = x.slice(0, -2);
    else if (x.length > 2 && x.endsWith('ה')) x = x.slice(0, -1);
    return x.replace(/יי/g, 'י');
  }
  if (/(o|s|x|ch|sh)es$/.test(w)) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
  return w;
}
const words = s => normalize(s).split(' ').filter(Boolean).map(stem);

export const foodName = (food, lang) => (food?.names?.[lang]?.[0] || food?.names?.he?.[0] || food?.names?.en?.[0] || '');
const allNames = food => Object.values(food.names || {}).flat();

/** Lets names be looked up quickly. Rebuild when the foods change. */
export function indexFoods(foods) {
  const byKey = new Map();
  const phrases = []; // { w: words, food }
  for (const food of foods) for (const name of allNames(food)) {
    const w = words(name);
    if (!w.length) continue;
    const key = w.join(' ');
    if (!byKey.has(key)) byKey.set(key, food);
    phrases.push({ w, food });
  }
  // Longer names first, so "חזה עוף" wins over "עוף".
  phrases.sort((a, b) => b.w.length - a.w.length || b.w.join('').length - a.w.join('').length);
  return { foods, byKey, phrases };
}

/** The food named exactly this (ignoring plurals and "ה"), or null. */
export function exactFood(name, index) {
  const w = words(name);
  return (w.length && index.byKey.get(w.join(' '))) || null;
}

/** The food an ingredient name means, or null. "2 שיני שום כתושות" finds garlic. */
export function matchFood(name, index) {
  const exact = exactFood(name, index);
  if (exact) return exact;
  const w = words(name);
  if (!w.length) return null;
  for (const { w: p, food } of index.phrases) {
    for (let i = 0; i + p.length <= w.length; i++) {
      if (p.every((x, j) => w[i + j] === x)) return food;
    }
  }
  return null;
}

// Typos between two words: a letter added, dropped, changed, or two letters swapped each count as one.
function distance(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 3;
  let before = null, prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (before && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) cur[j] = Math.min(cur[j], before[j - 2] + 1);
    }
    before = prev; prev = cur;
  }
  return prev[b.length];
}

/** A food whose name is one or two typos away ("בצעל" → onion), or null. */
export function didYouMean(name, index) {
  const n = normalize(name);
  if (n.length < 3) return null;
  const allowed = n.length <= 5 ? 1 : 2;
  let best = null, bestD = allowed + 1;
  for (const food of index.foods) for (const alias of allNames(food)) {
    const d = distance(n, normalize(alias));
    if (d < bestD) { best = food; bestD = d; }
  }
  return bestD <= allowed ? best : null;
}

/** Whether one of the food's names has a word starting with the text ("תות" finds strawberries, not "פיתות"). */
export function nameStartsWith(food, text) {
  const n = normalize(text);
  return allNames(food).some(alias => {
    const w = normalize(alias).split(' ');
    return w.some((_, i) => w.slice(i).join(' ').startsWith(n));
  });
}

/** Foods to offer while typing: names in your language that start with the text, then other matches. */
export function suggestFoods(text, index, lang, limit = 5) {
  const n = normalize(text);
  if (n.length < 2) return [];
  const scored = [];
  for (const food of index.foods) {
    let score = 0;
    for (const [l, list] of Object.entries(food.names || {})) for (const alias of list) {
      const a = normalize(alias);
      const s = a.startsWith(n) ? 3 : a.split(' ').some(x => x.startsWith(n)) ? 2 : 0;
      if (s) score = Math.max(score, s + (l === lang ? 0.5 : 0));
    }
    if (score) scored.push({ food, score });
  }
  scored.sort((a, b) => b.score - a.score || foodName(a.food, lang).length - foodName(b.food, lang).length);
  return scored.slice(0, limit).map(x => x.food);
}

const ML = { 'מ״ל': 1, 'כוס': 240, 'כף': 15, 'כפית': 5 };
const PIECES = ['יח׳', 'ראש', 'קופסה', 'שקית'];

/** How many grams an amount is, or null when we can't tell (say, a cup of something without a density). */
export function gramsOf(q, u, food) {
  if (!food) return null;
  if (u === 'גרם') return q;
  if (u === 'ק״ג') return q * 1000;
  if (ML[u]) return food.density ? q * ML[u] * food.density : null;
  if (u === 'כיכר') return food.aisle === 'bread' ? q * (food.piece_g >= 200 ? food.piece_g : 750) : food.piece_g ? q * food.piece_g : null;
  if (PIECES.includes(u)) return food.piece_g ? q * food.piece_g : null;
  return null;
}

/**
 * Nutrition for one serving of a recipe. `foodFor(ingredient)` returns the food for an ingredient
 * row ([name, qty for 4, unit, aisle, price, foodId]) or null.
 * Returns { kcal, protein, carbs, fat, missing: [names], counted }.
 */
export function nutritionOf(recipe, foodFor) {
  const total = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  const missing = [];
  let counted = 0;
  for (const row of recipe.ing || []) {
    const food = foodFor(row);
    const g = gramsOf(row[1], row[2], food);
    if (g == null) { missing.push(row[0]); continue; }
    counted++;
    for (const k of Object.keys(total)) total[k] += (Number(food[k]) || 0) * g / 100;
  }
  const per = Object.fromEntries(Object.entries(total).map(([k, v]) => [k, v / 4]));
  return { ...per, missing, counted };
}

/** True when an amount looks like a typo: a huge serving, or lots of salt. Grams are per serving. */
export function looksTooMuch(food, gramsPerServing) {
  if (!food || gramsPerServing == null) return false;
  if (gramsPerServing > 800) return true;
  if ((Number(food.kcal) || 0) * gramsPerServing / 100 > 1500) return true;
  return Number(food.kcal) === 0 && Number(food.density) > 1 && gramsPerServing > 15; // salt
}
