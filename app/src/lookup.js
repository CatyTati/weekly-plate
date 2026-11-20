// Looking up a food's nutrition in Open Food Facts (a free, open database of food products,
// many of them Israeli) so nobody has to type the numbers from a package. Values are per 100 g.
const SEARCH = 'https://search.openfoodfacts.org/search';
const FIELDS = 'code,product_name,brands,nutriments';

const valid = (v, max) => (typeof v === 'number' && v >= 0 && v <= max ? v : null);
const round1 = v => (v == null ? null : Math.round(v * 10) / 10);

/**
 * The usable products in a search response: a name and calories are required, values that
 * can't be right (fat over 100 g in 100 g) are dropped, and so is a product whose protein,
 * carbs and fat don't add up to anything near its calories.
 */
export function parseHits(json) {
  const out = [];
  for (const h of json?.hits || []) {
    const n = h.nutriments || {};
    const name = String(h.product_name || '').trim();
    const kj = valid(n['energy-kj_100g'] ?? n.energy_100g, 3800);
    const kcal = valid(n['energy-kcal_100g'], 900) ?? (kj == null ? null : kj / 4.184);
    if (!name || kcal == null) continue;
    const protein = valid(n.proteins_100g, 100), carbs = valid(n.carbohydrates_100g, 100), fat = valid(n.fat_100g, 100);
    if (protein != null && carbs != null && fat != null) {
      const counted = 4 * protein + 4 * carbs + 9 * fat;
      if (Math.abs(counted - kcal) > 0.35 * kcal + 25) continue;
    }
    const brands = Array.isArray(h.brands) ? h.brands : h.brands ? [h.brands] : [];
    out.push({ id: h.code || name, name, brand: brands.filter(Boolean).join(', '),
      kcal: Math.round(kcal), protein: round1(protein), carbs: round1(carbs), fat: round1(fat) });
  }
  return out;
}

/** Searches each of the names (Hebrew, English, Russian…) and returns up to `limit` products, best first. */
export async function findNutrition(names, limit = 6) {
  const terms = [...new Set(names.map(x => String(x || '').trim()).filter(Boolean))].slice(0, 3);
  const results = await Promise.all(terms.map(async q => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10000);
    try {
      const url = `${SEARCH}?q=${encodeURIComponent(q)}&page_size=15&fields=${FIELDS}`;
      const res = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'WeeklyPlate/1.0' } });
      if (!res.ok) throw new Error(String(res.status));
      return parseHits(await res.json());
    } finally {
      clearTimeout(timer);
    }
  }));
  const seen = new Set();
  const list = [];
  // Take turns between the languages so each one's best match is near the top.
  for (let i = 0; list.length < limit && results.some(r => r[i]); i++) {
    for (const r of results) {
      const p = r[i];
      if (!p) continue;
      const key = `${p.name}|${p.brand}|${p.kcal}`;
      if (!seen.has(key) && list.length < limit) { seen.add(key); list.push(p); }
    }
  }
  return list;
}
