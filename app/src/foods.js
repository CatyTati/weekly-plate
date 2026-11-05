// The foods database in Supabase: what everyone can use (approved), what you suggested
// (pending until an admin approves it), and approving or rejecting suggestions.
// Foods are loaded once and shared by every screen through useFoods().
import { useEffect, useMemo, useState } from 'react';
import { isDemo, supabase } from './auth';
import { indexFoods, matchFood } from './nutrition';

const COLUMNS = 'id, names, aisle, kcal, protein, carbs, fat, piece_g, density, status, created_by, created_at';
const fromRow = r => ({ ...r, kcal: Number(r.kcal), protein: r.protein == null ? null : Number(r.protein),
  carbs: r.carbs == null ? null : Number(r.carbs), fat: r.fat == null ? null : Number(r.fat),
  piece_g: r.piece_g == null ? null : Number(r.piece_g), density: r.density == null ? null : Number(r.density) });

let foods = [];
let admin = false;
let loading = null;
let loadedFor = null; // whose foods are loaded; another account starts over
const listeners = new Set();
const changed = () => listeners.forEach(f => f());
const put = list => {
  const byId = new Map(foods.map(f => [f.id, f]));
  for (const f of list) byId.set(f.id, f);
  foods = [...byId.values()];
  changed();
};

/** Loads every food you may see: approved ones, yours, and (for admins) everything waiting. */
export function loadFoods(me, force) {
  if (isDemo || !me) return Promise.resolve();
  if (loading && !force && loadedFor === me) return loading;
  loadedFor = me;
  loading = Promise.all([
    supabase.from('foods').select(COLUMNS).or(`status.eq.approved,created_by.eq.${me}`).limit(5000),
    supabase.from('app_admins').select('user_id').eq('user_id', me).maybeSingle(),
  ]).then(async ([f, a]) => {
    if (f.error) throw f.error;
    admin = !!a.data;
    let list = f.data.map(fromRow);
    if (admin) {
      const p = await supabase.from('foods').select(COLUMNS).neq('status', 'approved').limit(5000);
      if (!p.error) list = list.concat(p.data.map(fromRow));
    }
    foods = [];
    put(list);
  }).catch(e => { loading = null; throw e; });
  return loading;
}

/** Fetches foods used by someone else's recipes that aren't loaded yet. */
export async function ensureFoods(ids) {
  const want = [...new Set(ids.filter(Boolean))].filter(id => !foods.some(f => f.id === id));
  if (isDemo || !want.length) return;
  const { data, error } = await supabase.from('foods').select(COLUMNS).in('id', want);
  if (!error) put(data.map(fromRow));
}

/**
 * Suggests a new food. It's yours to use right away and waits for an admin before others see it.
 * An admin's own food goes straight into the database.
 */
export async function suggestFood(me, food) {
  const row = { names: food.names, aisle: food.aisle, kcal: food.kcal, protein: food.protein, carbs: food.carbs, fat: food.fat,
    piece_g: food.piece_g, density: food.density, created_by: me, status: 'pending' };
  const { data, error } = await supabase.from('foods').insert(row).select(COLUMNS).single();
  if (error) throw error;
  let f = fromRow(data);
  put([f]);
  if (admin) f = await reviewFood(f.id, 'approved');
  return f;
}

/** Admin only: approve or reject a suggested food. */
export async function reviewFood(id, status) {
  const { data, error } = await supabase.from('foods').update({ status, reviewed_at: new Date().toISOString() }).eq('id', id).select(COLUMNS).single();
  if (error) throw error;
  const f = fromRow(data);
  put([f]);
  return f;
}

/** Deletes a food: admins any, others only their own that wasn't approved. */
export async function deleteFood(id) {
  const { error } = await supabase.from('foods').delete().eq('id', id);
  if (error) throw error;
  foods = foods.filter(f => f.id !== id);
  changed();
}

/** Who added each food, by id. */
export async function addersOf(ids) {
  const want = [...new Set(ids.filter(Boolean))];
  if (isDemo || !want.length) return {};
  const { data, error } = await supabase.from('profiles').select('id, display_name').in('id', want);
  if (error) return {};
  return Object.fromEntries(data.map(p => [p.id, p.display_name || '']));
}

/**
 * The foods, kept current. `forRow(ingredient)` is the food for a recipe ingredient:
 * the one it was linked to, or else the one its name matches.
 * Only approved foods and your own are offered for new ingredients.
 */
export function useFoods() {
  const [, render] = useState(0);
  useEffect(() => {
    const f = () => render(n => n + 1);
    listeners.add(f);
    return () => listeners.delete(f);
  }, []);
  const list = foods;
  return useMemo(() => {
    const byId = new Map(list.map(f => [f.id, f]));
    const usable = list.filter(f => f.status !== 'rejected');
    const index = indexFoods(usable);
    return {
      foods: list, admin, index, byId,
      forRow: row => (row[5] && byId.get(row[5])) || matchFood(row[0], index),
    };
  }, [list]);
}
