// App state with on-device persistence (AsyncStorage).
// Later this is replaced by calls to the Python API; the screens don't change.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { R, COOKS, makeT, isRtl, planWeek, swapDay as swap } from './logic';
import { currentUser, onAuthChange, signOut } from './auth';

const KEY = 'weekly-plate/v1';
const DEFAULT = {
  onboarded: false,
  lang: 'he',
  modes: { kids: true, budget: true, prep: false, quick: true },
  servings: 4,
  budget: 450,
  plan: [],
  checked: {},
  custom: [],
  following: ['noa', 'amit'],
  liked: {},
  saved: {},
  homeShows: { stories: true, tonight: true, week: true, shortcuts: true },
};

const Ctx = createContext(null);

export function StoreProvider({ children }) {
  const [state, setState] = useState(DEFAULT);
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const loaded = useRef(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(KEY).then(raw => { if (raw) setState(s => ({ ...s, ...JSON.parse(raw), homeShows: { ...DEFAULT.homeShows, ...(JSON.parse(raw).homeShows || {}) } })); }).catch(() => {}),
      currentUser().then(setUser).catch(() => {}),
    ]).finally(() => { loaded.current = true; setReady(true); });
    return onAuthChange(setUser);
  }, []);

  useEffect(() => {
    if (loaded.current) AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
  }, [state]);

  const recipes = useMemo(() => R.concat(state.custom), [state.custom]);
  const byId = useCallback(id => recipes.find(r => r.id === id), [recipes]);
  const t = useMemo(() => makeT(state.lang), [state.lang]);

  const actions = useMemo(() => ({
    set: patch => setState(s => ({ ...s, ...(typeof patch === 'function' ? patch(s) : patch) })),
    toggleMode: k => setState(s => ({ ...s, modes: { ...s.modes, [k]: !s.modes[k] } })),
    buildWeek: () => setState(s => ({ ...s, onboarded: true, checked: {}, plan: planWeek(R.concat(s.custom), s.modes) })),
    swapDay: d => setState(s => ({ ...s, plan: swap(s.plan, d, R.concat(s.custom), s.modes) })),
    setDay: (d, id) => setState(s => { const plan = s.plan.slice(); plan[d] = id; return { ...s, plan }; }),
    toggleItem: key => setState(s => ({ ...s, checked: { ...s.checked, [key]: !s.checked[key] } })),
    clearChecks: () => setState(s => ({ ...s, checked: {} })),
    addRecipe: r => setState(s => ({ ...s, custom: [...s.custom, r] })),
    deleteRecipe: id => setState(s => ({ ...s, custom: s.custom.filter(r => r.id !== id), plan: s.plan.map(p => (p === id ? null : p)) })),
    toggleFollow: id => setState(s => ({ ...s, following: s.following.includes(id) ? s.following.filter(x => x !== id) : [...s.following, id] })),
    copyPlan: cookId => setState(s => ({ ...s, checked: {}, plan: COOKS.find(c => c.id === cookId).plan.slice() })),
    toggleLike: id => setState(s => ({ ...s, liked: { ...s.liked, [id]: !s.liked[id] } })),
    toggleSave: id => setState(s => ({ ...s, saved: { ...s.saved, [id]: !s.saved[id] } })),
    toggleHome: k => setState(s => ({ ...s, homeShows: { ...s.homeShows, [k]: !s.homeShows[k] } })),
    signedIn: u => setUser(u),
    logout: async () => { try { await signOut(); } finally { setUser(null); } },
  }), []);

  const value = useMemo(() => ({ state, ready, user, recipes, byId, t, rtl: isRtl(state.lang), ...actions }), [state, ready, user, recipes, byId, t, actions]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useStore = () => useContext(Ctx);
