// Following other users, stored in Supabase (profiles and follows tables).
//
// Row Level Security already decides what is allowed: everyone signed in can read
// names and who follows whom, and you can only add or remove follows of your own.
// In demo mode there is no server, so these return nothing.
import { isDemo, supabase } from './auth';

const NAME_MAX = 40;

/** Puts the name from sign-up on the profile, so other people can find you. */
export async function syncProfileName(user) {
  const name = (user?.name || '').trim().slice(0, NAME_MAX);
  if (isDemo || !user?.id || !name) return;
  await supabase.from('profiles').update({ display_name: name }).eq('id', user.id).is('display_name', null);
}

async function profilesByIds(ids) {
  if (!ids.length) return [];
  const { data, error } = await supabase.from('profiles').select('id, display_name').in('id', ids);
  if (error) throw error;
  return data.map(p => ({ id: p.id, name: p.display_name || '' }));
}

/** People who follow you, and people you follow. */
export async function myConnections(me) {
  if (isDemo || !me) return { followers: [], following: [] };
  const [a, b] = await Promise.all([
    supabase.from('follows').select('follower_id').eq('followee_id', me),
    supabase.from('follows').select('followee_id').eq('follower_id', me),
  ]);
  if (a.error) throw a.error;
  if (b.error) throw b.error;
  const [followers, following] = await Promise.all([
    profilesByIds(a.data.map(r => r.follower_id)),
    profilesByIds(b.data.map(r => r.followee_id)),
  ]);
  return { followers, following };
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

export async function follow(me, id) {
  const { error } = await supabase.from('follows').insert({ follower_id: me, followee_id: id });
  if (error && error.code !== '23505') throw error; // 23505: already following
}

export async function unfollow(me, id) {
  const { error } = await supabase.from('follows').delete().eq('follower_id', me).eq('followee_id', id);
  if (error) throw error;
}
