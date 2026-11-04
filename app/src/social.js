// Following other users, sharing recipes and weekly plans, stored in Supabase.
//
// Row Level Security decides what is allowed: everyone signed in can read names,
// follows and public recipes; only approved followers can read someone's weekly plans;
// a private account approves each new follower. In demo mode there is no server.
import { isDemo, supabase } from './auth';
import * as ImageManipulator from 'expo-image-manipulator';
import { UNIT_T } from './data.js';

const NAME_MAX = 40;
const UNIT_CODE = UNIT_T.en; // Hebrew unit -> code saved in the database
const UNIT_FROM_CODE = Object.fromEntries(Object.entries(UNIT_CODE).map(([he, code]) => [code, he]));

/** Puts the name from sign-up on the profile, so other people can find you. */
export async function syncProfileName(user) {
  const name = (user?.name || '').trim().slice(0, NAME_MAX);
  if (isDemo || !user?.id || !name) return;
  await supabase.from('profiles').update({ display_name: name }).eq('id', user.id).is('display_name', null);
}

/* ---------- profiles and follows ---------- */

async function profilesByIds(ids) {
  if (!ids.length) return [];
  const { data, error } = await supabase.from('profiles').select('id, display_name').in('id', ids);
  if (error) throw error;
  return data.map(p => ({ id: p.id, name: p.display_name || '' }));
}

/**
 * Your follows. followers: approved; requests: waiting for you to approve;
 * following: people you follow, each with status 'approved' or 'pending'.
 */
export async function myConnections(me) {
  if (isDemo || !me) return { followers: [], requests: [], following: [] };
  const [a, b] = await Promise.all([
    supabase.from('follows').select('follower_id, status').eq('followee_id', me),
    supabase.from('follows').select('followee_id, status').eq('follower_id', me),
  ]);
  if (a.error) throw a.error;
  if (b.error) throw b.error;
  const [them, us] = await Promise.all([
    profilesByIds(a.data.map(r => r.follower_id)),
    profilesByIds(b.data.map(r => r.followee_id)),
  ]);
  const statusOf = (rows, key) => Object.fromEntries(rows.map(r => [r[key], r.status]));
  const theirStatus = statusOf(a.data, 'follower_id'), ourStatus = statusOf(b.data, 'followee_id');
  return {
    followers: them.filter(p => theirStatus[p.id] === 'approved'),
    requests: them.filter(p => theirStatus[p.id] === 'pending'),
    following: us.map(p => ({ ...p, status: ourStatus[p.id] })),
  };
}

/** People on the app, newest first. With a query, only names that match. */
export async function listPeople(me, query = '') {
  if (isDemo) return [];
  const q = query.replace(/[%_,()\\]/g, ' ').trim();
  let req = supabase.from('profiles').select('id, display_name').neq('id', me).not('display_name', 'is', null);
  if (q) req = req.ilike('display_name', `%${q}%`);
  const { data, error } = await req.order('created_at', { ascending: false }).limit(30);
  if (error) throw error;
  return data.map(p => ({ id: p.id, name: p.display_name || '' }));
}

/** Someone's profile: name, private or not, and how many approved followers. */
export async function getProfile(id) {
  const [p, n] = await Promise.all([
    supabase.from('profiles').select('id, display_name, is_private').eq('id', id).single(),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('followee_id', id).eq('status', 'approved'),
  ]);
  if (p.error) throw p.error;
  return { id, name: p.data.display_name || '', isPrivate: p.data.is_private, followers: n.count || 0 };
}

export async function getPrivate(me) {
  if (isDemo || !me) return false;
  const { data, error } = await supabase.from('profiles').select('is_private').eq('id', me).single();
  if (error) throw error;
  return data.is_private;
}

export async function setPrivate(me, value) {
  const { error } = await supabase.from('profiles').update({ is_private: value }).eq('id', me);
  if (error) throw error;
}

/** Follows someone. The database makes it a request if their account is private. */
export async function follow(me, id) {
  const { error } = await supabase.from('follows').insert({ follower_id: me, followee_id: id });
  if (error && error.code !== '23505') throw error; // 23505: already following
}

/** Unfollows, or cancels a request you sent. */
export async function unfollow(me, id) {
  const { error } = await supabase.from('follows').delete().eq('follower_id', me).eq('followee_id', id);
  if (error) throw error;
}

export async function approveFollower(me, id) {
  const { error } = await supabase.from('follows').update({ status: 'approved' }).eq('followee_id', me).eq('follower_id', id);
  if (error) throw error;
}

/** Declines a request, or removes a follower. */
export async function removeFollower(me, id) {
  const { error } = await supabase.from('follows').delete().eq('followee_id', me).eq('follower_id', id);
  if (error) throw error;
}

/* ---------- recipes ---------- */

const toRow = r => ({
  name: r.name, prep_minutes: r.time, method: r.steps, tags: r.tags,
  kid_note: r.kid || null, keeps_days: r.keep || null, cook_method: r.m || 'stove', is_public: true,
  ingredients: r.ing.map(([name, qty, unit, aisle]) => ({ name, qty, unit: UNIT_CODE[unit] || 'pcs', aisle })),
});

const fromRow = row => ({
  id: row.id, cloud: row.id, owner: row.owner_id, custom: true,
  name: row.name, time: row.prep_minutes, m: row.cook_method, tags: row.tags,
  kid: row.kid_note || undefined, keep: row.keeps_days || 0, steps: row.method, desc: row.description || '',
  ing: [...(row.recipe_ingredients || [])].sort((a, b) => a.position - b.position)
    .map(i => [i.name, Number(i.qty), UNIT_FROM_CODE[i.unit] || i.unit, i.aisle, 0]),
  photos: [...(row.recipe_photos || [])].sort((a, b) => a.position - b.position).map(p => photoUrl(p.storage_path)),
});

/* ---------- photos ---------- */
// Photos live in the public "recipe-photos" bucket, each user in a folder named after their id.

const BUCKET = 'recipe-photos';
const photoUrl = path => supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
const pathOf = url => url.split(`/object/public/${BUCKET}/`)[1];
const isWeb = uri => /^https?:/.test(uri);

// A photo from this phone becomes a JPEG of at most 1280px wide; one from the web is copied as is.
async function photoBytes(uri) {
  if (isWeb(uri)) return new Uint8Array(await (await fetch(uri)).arrayBuffer());
  const img = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 1280 } }],
    { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG, base64: true });
  return Uint8Array.from(atob(img.base64), c => c.charCodeAt(0));
}

/**
 * Saves a recipe's photos in the database, in order, and removes the ones that were taken off.
 * Returns the photo list as web addresses.
 */
export async function syncPhotos(owner, recipeId, photos) {
  const paths = [];
  for (const uri of photos.slice(0, 3)) {
    const mine = isWeb(uri) && pathOf(uri)?.startsWith(owner + '/');
    if (mine) { paths.push(pathOf(uri)); continue; }
    const path = `${owner}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, await photoBytes(uri), { contentType: 'image/jpeg' });
    if (error) throw error;
    paths.push(path);
  }
  const old = await supabase.from('recipe_photos').select('storage_path').eq('recipe_id', recipeId);
  if (old.error) throw old.error;
  const del = await supabase.from('recipe_photos').delete().eq('recipe_id', recipeId);
  if (del.error) throw del.error;
  if (paths.length) {
    const ins = await supabase.from('recipe_photos').insert(paths.map((storage_path, position) => ({ recipe_id: recipeId, position, storage_path })));
    if (ins.error) throw ins.error;
  }
  const gone = old.data.map(p => p.storage_path).filter(p => !paths.includes(p));
  if (gone.length) await supabase.storage.from(BUCKET).remove(gone);
  return paths.map(photoUrl);
}

/**
 * Saves one of your recipes so others can see it, and if it's a copy, records where it came from.
 * Returns its id in the database and whether the copy was recorded.
 */
export async function pushRecipe(r) {
  const { data: id, error } = await supabase.rpc('create_recipe', { payload: toRow(r) });
  if (error) throw error;
  if (r.desc) await supabase.from('recipes').update({ description: r.desc.slice(0, 160) }).eq('id', id);
  let noted = false;
  if (r.copiedFrom) noted = await noteCopy(id, r.copiedFrom).then(() => true, e => { console.warn('Copy note not saved:', e?.message || e); return false; });
  return { id, noted };
}

/** People who copied one of your recipes. Only you, the recipe's cook, can read this. */
export async function copiersOf(recipeId) {
  const copies = await supabase.from('recipe_copies').select('copy_id').eq('source_recipe', recipeId);
  if (copies.error) throw copies.error;
  if (!copies.data.length) return [];
  const owners = await supabase.from('recipes').select('owner_id').in('id', copies.data.map(c => c.copy_id));
  if (owners.error) throw owners.error;
  return profilesByIds([...new Set(owners.data.map(r => r.owner_id))]);
}

/**
 * Everything of yours in the database: recipes (with photos and where copies came from)
 * and weeks. Each recipe's id is its id in the database.
 */
export async function loadMine(me) {
  const [recipes, plans] = await Promise.all([
    supabase.from('recipes').select('*, recipe_ingredients(*), recipe_photos(*)').eq('owner_id', me).order('created_at'),
    supabase.from('weekly_plans').select('week_start, plan_days(day, recipe_id, builtin_id)').eq('owner_id', me),
  ]);
  if (recipes.error) throw recipes.error;
  if (plans.error) throw plans.error;
  const ids = recipes.data.map(r => r.id);
  const copies = ids.length ? await supabase.from('recipe_copies').select('copy_id, source_owner, source_recipe').in('copy_id', ids) : { data: [] };
  if (copies.error) throw copies.error;
  const cooks = await profilesByIds([...new Set(copies.data.map(c => c.source_owner))]);
  const copyOf = Object.fromEntries(copies.data.map(c => [c.copy_id, c]));
  return {
    recipes: recipes.data.map(row => {
      const r = fromRow(row);
      const c = copyOf[row.id];
      const from = c ? { copiedFrom: c.source_recipe || 'deleted', copiedFromName: cooks.find(p => p.id === c.source_owner)?.name || '', copyNoted: true } : {};
      return { ...r, owner: undefined, photosSaved: JSON.stringify(r.photos), ...from };
    }),
    weeks: Object.fromEntries(plans.data.map(w => {
      const plan = Array(7).fill(null);
      w.plan_days.forEach(d => { plan[d.day] = d.recipe_id || d.builtin_id; });
      return [w.week_start, plan];
    })),
  };
}

/**
 * Records that one of your saved recipes is a copy of `sourceId`, so its cook (and only they)
 * can see it was copied. Returns false if the original can't be found any more.
 */
export async function noteCopy(copyId, sourceId) {
  const src = await supabase.from('recipes').select('owner_id').eq('id', sourceId).maybeSingle();
  if (src.error) throw src.error;
  if (!src.data?.owner_id) return false;
  const { error } = await supabase.from('recipe_copies').insert({ copy_id: copyId, source_owner: src.data.owner_id, source_recipe: sourceId });
  if (error && error.code !== '23505') throw error; // 23505: already noted
  return true;
}

/** Saves changes to one of your recipes. Ingredients are replaced position by position. */
export async function updateCloudRecipe(id, r) {
  const { ingredients, ...row } = toRow(r);
  const up = await supabase.from('recipes').update({ ...row, description: r.desc ? r.desc.slice(0, 160) : null }).eq('id', id);
  if (up.error) throw up.error;
  const ing = await supabase.from('recipe_ingredients').upsert(ingredients.map((i, position) => ({ recipe_id: id, position, ...i })));
  if (ing.error) throw ing.error;
  const extra = await supabase.from('recipe_ingredients').delete().eq('recipe_id', id).gte('position', ingredients.length);
  if (extra.error) throw extra.error;
}

export async function deleteCloudRecipe(id) {
  const photos = await supabase.from('recipe_photos').select('storage_path').eq('recipe_id', id);
  const { error } = await supabase.from('recipes').delete().eq('id', id);
  if (error) throw error;
  const paths = (photos.data || []).map(p => p.storage_path);
  if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
}

/** Someone's recipes. Ones they copied from `me` are marked copiedFromMe; only `me` can see that. */
export async function recipesOf(owner, me) {
  const { data, error } = await supabase.from('recipes').select('*, recipe_ingredients(*), recipe_photos(*)')
    .eq('owner_id', owner).order('created_at', { ascending: false });
  if (error) throw error;
  const copies = data.length && me ? await supabase.from('recipe_copies').select('copy_id').eq('source_owner', me).in('copy_id', data.map(r => r.id)) : null;
  const fromMe = new Set((copies?.data || []).map(c => c.copy_id));
  return data.map(row => ({ ...fromRow(row), copiedFromMe: fromMe.has(row.id) }));
}

/* ---------- weekly plans ---------- */

/** Saves a week. `days` has 7 entries: a recipe's database id, a built-in id, or null. */
export async function pushWeek(key, days) {
  const { error } = await supabase.rpc('save_week', { week: key, days });
  if (error) throw error;
}

/** Someone's weeks from `fromKey` on (only readable by approved followers). */
export async function weeksOf(owner, fromKey) {
  const { data, error } = await supabase.from('weekly_plans').select('week_start, plan_days(day, recipe_id, builtin_id)')
    .eq('owner_id', owner).gte('week_start', fromKey).order('week_start').limit(4);
  if (error) throw error;
  return data.map(w => {
    const plan = Array(7).fill(null);
    w.plan_days.forEach(d => { plan[d.day] = d.recipe_id || d.builtin_id; });
    return { key: w.week_start, plan };
  }).filter(w => w.plan.some(Boolean));
}
