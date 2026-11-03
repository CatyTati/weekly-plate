// App state with on-device persistence (AsyncStorage), one copy per account.
// Your own recipes and weekly plans are also saved to Supabase, so followers can see them.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { makeT, isRtl, planWeek, swapDay as swap, weekKey } from './logic';
import * as Linking from 'expo-linking';
import { currentUser, handleAuthLink, isDemo, isRecoveryLink, onAuthChange, signOut } from './auth';
import { deleteCloudRecipe, pushRecipe, pushWeek, syncProfileName, updateCloudRecipe } from './social';

const KEY = 'weekly-plate/v1';
const DEFAULT = {
  onboarded: false,
  lang: 'he',
  modes: { kids: true, budget: true, prep: false, quick: true },
  servings: 4,
  budget: 450,
  plan: [], // this week; the same list is also in weeks
  weeks: {}, // every saved week, by weekKey
  checked: {},
  custom: [],
  liked: {},
  saved: {},
  recipeComments: {},
  theme: 'auto', // auto follows the phone; or light, dark
};

const Ctx = createContext(null);
const keyFor = id => (id ? `${KEY}:${id}` : KEY);

// Saves a week's plan. `plan` always follows the week we are in.
const withPlan = (s, plan, key = weekKey()) => ({ ...s, weeks: { ...s.weeks, [key]: plan }, plan: key === weekKey() ? plan : s.plan });

// Starts each new week empty, and keeps a plan saved before weeks existed.
// Days that name a recipe you no longer have (such as the removed sample recipes) are emptied.
function loadSaved(saved) {
  const key = weekKey();
  const custom = saved.custom || [];
  const have = id => custom.some(r => r.id === id);
  const raw = saved.weeks || (saved.plan?.length ? { [key]: saved.plan } : {});
  const weeks = Object.fromEntries(Object.entries(raw).map(([k, p]) => [k, p.map(id => (id && have(id) ? id : null))]));
  const { following, homeShows, ...rest } = saved; // sample cooks and their stories, now removed
  return { ...DEFAULT, ...rest, weeks, plan: weeks[key] || [] };
}

// Adds a copy of someone's recipe to `custom`, unless it is already there.
// A name you already use gets the cook's name added, since names are unique per account.
function copyInto(custom, r) {
  const have = custom.find(x => x.copiedFrom === r.cloud);
  if (have) return { custom, id: have.id };
  const taken = custom.some(x => x.name.toLowerCase() === r.name.toLowerCase());
  const id = 'c' + Date.now() + Math.random().toString(36).slice(2, 6);
  const copy = { ...r, id, cloud: undefined, owner: undefined, copiedFrom: r.cloud, name: taken && r.ownerName ? `${r.name} · ${r.ownerName}`.slice(0, 60) : r.name };
  return { custom: [...custom, copy], id };
}

// Each account keeps its own data on the phone. The first account to sign in here
// keeps what was saved before accounts were kept apart.
async function loadFor(id) {
  const own = await AsyncStorage.getItem(keyFor(id));
  if (own) return loadSaved(JSON.parse(own));
  if (!id) return null;
  const old = await AsyncStorage.getItem(KEY);
  if (!old || JSON.parse(old).claimedBy) return null;
  await AsyncStorage.setItem(KEY, JSON.stringify({ lang: JSON.parse(old).lang, claimedBy: id }));
  return loadSaved(JSON.parse(old));
}

// A week as the database stores it: a recipe's database id, a built-in id, or null.
// Returns null while one of your recipes is not saved yet.
function cloudDays(plan, custom) {
  const days = [];
  for (let d = 0; d < 7; d += 1) {
    const id = plan[d];
    const mine = id && custom.find(r => r.id === id);
    if (mine && !mine.cloud) return null;
    days.push(!id ? null : mine ? mine.cloud : id);
  }
  return days;
}


export function StoreProvider({ children }) {
  const [state, setState] = useState(DEFAULT);
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [recovery, setRecovery] = useState(false); // opened from a password reset email
  const [syncFailed, setSyncFailed] = useState(false); // a recipe or week did not reach the database
  const loadedFor = useRef(undefined); // the account whose data is in `state`
  const pushing = useRef(new Set()); // recipes being saved to the database
  const pushedWeeks = useRef({}); // what each week looked like when last saved

  const [authChecked, setAuthChecked] = useState(false);
  const userId = user?.id ?? null;

  useEffect(() => {
    currentUser().then(setUser).catch(() => {}).finally(() => setAuthChecked(true));
    const openLink = url => {
      if (isRecoveryLink(url)) setRecovery(true);
      return handleAuthLink(url).catch(() => setRecovery(false));
    };
    Linking.getInitialURL().then(openLink).catch(() => {});
    const links = Linking.addEventListener('url', e => { openLink(e.url); });
    const unsubscribe = onAuthChange(setUser);
    return () => { links.remove(); unsubscribe(); };
  }, []);

  useEffect(() => { syncProfileName(user).catch(() => {}); }, [user]);

  // Load the data of whoever is signed in (or the signed-out language) when that changes.
  useEffect(() => {
    if (!authChecked) return undefined;
    let live = true;
    loadedFor.current = undefined;
    pushedWeeks.current = {};
    loadFor(userId).catch(() => null).then(saved => {
      if (!live) return;
      setState(cur => saved || { ...DEFAULT, lang: cur.lang });
      loadedFor.current = userId;
      setReady(true);
    });
    return () => { live = false; };
  }, [userId, authChecked]);

  useEffect(() => {
    if (loadedFor.current === userId) AsyncStorage.setItem(keyFor(userId), JSON.stringify(state)).catch(() => {});
  }, [state, userId]);

  // Save your recipes to the database, so followers can see them.
  useEffect(() => {
    if (isDemo || !userId || loadedFor.current !== userId) return;
    state.custom.filter(r => !r.cloud && !pushing.current.has(r.id)).forEach(r => {
      pushing.current.add(r.id);
      pushRecipe(r)
        .then(cloud => { setSyncFailed(false); setState(s => ({ ...s, custom: s.custom.map(x => (x.id === r.id ? { ...x, cloud } : x)) })); })
        .catch(e => { console.warn('Recipe upload failed:', e?.message || e); setSyncFailed(true); })
        .finally(() => pushing.current.delete(r.id));
    });
    // Recipes changed after they were saved. `dirty` is when, so a newer change is not lost.
    state.custom.filter(r => r.cloud && r.dirty && !pushing.current.has(r.id)).forEach(r => {
      pushing.current.add(r.id);
      updateCloudRecipe(r.cloud, r)
        .then(() => { setSyncFailed(false); setState(s => ({ ...s, custom: s.custom.map(x => (x.id === r.id && x.dirty === r.dirty ? { ...x, dirty: undefined } : x)) })); })
        .catch(e => { console.warn('Recipe update failed:', e?.message || e); setSyncFailed(true); })
        .finally(() => pushing.current.delete(r.id));
    });
  }, [state.custom, userId]);

  // Save changed weeks a moment after the last change.
  useEffect(() => {
    if (isDemo || !userId || loadedFor.current !== userId) return undefined;
    const timer = setTimeout(() => {
      Object.entries(state.weeks).forEach(([key, plan]) => {
        const days = cloudDays(plan, state.custom);
        const json = JSON.stringify(days);
        if (!days || pushedWeeks.current[key] === json) return;
        pushedWeeks.current[key] = json;
        pushWeek(key, days).catch(e => { console.warn('Week upload failed:', e?.message || e); setSyncFailed(true); delete pushedWeeks.current[key]; });
      });
    }, 800);
    return () => clearTimeout(timer);
  }, [state.weeks, state.custom, userId]);

  const recipes = state.custom;
  const byId = useCallback(id => recipes.find(r => r.id === id), [recipes]);
  const t = useMemo(() => makeT(state.lang), [state.lang]);

  const actions = useMemo(() => ({
    set: patch => setState(s => ({ ...s, ...(typeof patch === 'function' ? patch(s) : patch) })),
    toggleMode: k => setState(s => ({ ...s, modes: { ...s.modes, [k]: !s.modes[k] } })),
    buildWeek: key => setState(s => withPlan({ ...s, onboarded: true, checked: {} }, planWeek(s.custom, s.modes), key)),
    swapDay: d => setState(s => withPlan(s, swap(s.plan, d, s.custom, s.modes))),
    setDay: (d, id, key = weekKey()) => setState(s => { const plan = (s.weeks[key] || []).slice(); plan[d] = id; return withPlan(s, plan, key); }),
    toggleItem: key => setState(s => ({ ...s, checked: { ...s.checked, [key]: !s.checked[key] } })),
    clearChecks: () => setState(s => ({ ...s, checked: {} })),
    addRecipe: r => setState(s => ({ ...s, custom: [...s.custom, r] })),
    updateRecipe: r => setState(s => ({ ...s, custom: s.custom.map(x => (x.id === r.id ? { ...x, ...r, dirty: x.cloud ? Date.now() : undefined } : x)) })),
    deleteRecipe: id => setState(s => {
      const r = s.custom.find(x => x.id === id);
      if (r?.cloud && !isDemo) deleteCloudRecipe(r.cloud).catch(() => {});
      const weeks = Object.fromEntries(Object.entries(s.weeks).map(([k, p]) => [k, p.map(x => (x === id ? null : x))]));
      return { ...s, custom: s.custom.filter(x => x.id !== id), weeks, plan: weeks[weekKey()] || [] };
    }),
    // Copies someone's recipe into yours, once. Returns nothing; the copy keeps a link to the original.
    copyRecipe: r => setState(s => ({ ...s, custom: copyInto(s.custom, r).custom })),
    // Copies someone's week (built-in ids, or their recipes) into a week of yours, from today on.
    copyWeekFrom: (plan, theirs, key = weekKey()) => setState(s => {
      const from = key === weekKey() ? new Date().getDay() : 0;
      let custom = s.custom;
      const next = (s.weeks[key] || []).slice();
      plan.forEach((id, d) => {
        if (d < from || !id) return;
        const r = theirs.find(x => x.id === id);
        if (!r) { next[d] = id; return; }
        const res = copyInto(custom, r);
        custom = res.custom;
        next[d] = res.id;
      });
      return withPlan({ ...s, custom, checked: key === weekKey() ? {} : s.checked }, next, key);
    }),
    toggleLike: id => setState(s => ({ ...s, liked: { ...s.liked, [id]: !s.liked[id] } })),
    addComment: (id, comment) => setState(s => ({ ...s, recipeComments: { ...s.recipeComments, [id]: [...(s.recipeComments[id] || []), comment] } })),
    toggleSave: id => setState(s => ({ ...s, saved: { ...s.saved, [id]: !s.saved[id] } })),
    signedIn: u => setUser(u),
    logout: async () => { try { await signOut(); } finally { setUser(null); } },
  }), []);

  const value = useMemo(() => ({ state, ready, user, recovery, syncFailed, endRecovery: () => setRecovery(false), recipes, byId, t, rtl: isRtl(state.lang), ...actions }), [state, ready, user, recovery, syncFailed, recipes, byId, t, actions]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useStore = () => useContext(Ctx);
