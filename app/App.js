import React, { useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Rubik_300Light, Rubik_400Regular, Rubik_500Medium } from '@expo-google-fonts/rubik';
import { StoreProvider, useStore } from './src/store';
import { NavCtx, MAIN_TABS } from './src/nav';
import { color } from './src/theme';
import { TabBar } from './src/components/ui';
import Auth from './src/screens/Auth';
import Onboarding from './src/screens/Onboarding';
import Home from './src/screens/Home';
import Week from './src/screens/Week';
import Feed from './src/screens/Feed';
import Shop from './src/screens/Shop';
import Prep from './src/screens/Prep';
import Recipes from './src/screens/Recipes';
import RecipeDetail from './src/screens/RecipeDetail';
import AddRecipe from './src/screens/AddRecipe';
import Community from './src/screens/Community';
import Settings from './src/screens/Settings';
import Menu from './src/screens/Menu';

function Root() {
  const { ready, state, user, rtl, signedIn } = useStore();
  const [view, setView] = useState('home'); // home | week | feed | shop | recipes | community | settings
  const [stack, setStack] = useState([]); // screens opened on top of a view
  const [menu, setMenu] = useState(false);
  const [feedOf, setFeedOf] = useState(null);

  const nav = useMemo(() => ({
    go: v => { setStack([]); setView(v); setMenu(false); },
    open: (screen, params = {}) => setStack(s => [...s, { screen, params }]),
    back: () => setStack(s => s.slice(0, -1)),
    openMenu: () => setMenu(true),
    showFeedOf: id => { setFeedOf(id); setStack([]); setView('feed'); },
  }), []);

  if (!ready) return <View style={{ flex: 1, backgroundColor: color.bg, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={color.accent} /></View>;

  const top = stack[stack.length - 1];
  let body;
  if (!user) body = <Auth onSignedIn={u => { signedIn(u); nav.go('home'); }} />;
  else if (!state.onboarded) body = <Onboarding />;
  else if (top?.screen === 'recipe') body = <RecipeDetail id={top.params.id} back={nav.back} />;
  else if (top?.screen === 'add') body = <AddRecipe back={nav.back} />;
  else if (top?.screen === 'prep') body = <Prep back={nav.back} />;
  else if (view === 'home') body = <Home />;
  else if (view === 'week') body = <Week open={nav.open} />;
  else if (view === 'feed') body = <Feed only={feedOf} />;
  else if (view === 'shop') body = <Shop />;
  else if (view === 'recipes') body = <Recipes open={nav.open} />;
  else if (view === 'community') body = <Community goWeek={() => nav.go('week')} />;
  else body = <Settings />;

  const signedInApp = user && state.onboarded;
  return (
    // `direction` mirrors every row for Hebrew without restarting the app.
    <NavCtx.Provider value={signedInApp ? nav : {}}>
      <View style={{ flex: 1, backgroundColor: color.bg, direction: rtl ? 'rtl' : 'ltr' }}>
        <StatusBar style="dark" />
        <View style={{ flex: 1 }}>{body}</View>
        {signedInApp && !top ? <TabBar tab={MAIN_TABS.includes(view) ? view : null} onTab={k => { if (k === 'feed') setFeedOf(null); nav.go(k); }} /> : null}
        {signedInApp ? <Menu visible={menu} onClose={() => setMenu(false)} current={top ? null : view} go={nav.go} openScreen={nav.open} /> : null}
      </View>
    </NavCtx.Provider>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({ Rubik_300Light, Rubik_400Regular, Rubik_500Medium });
  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: color.bg }} />;
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <Root />
      </StoreProvider>
    </SafeAreaProvider>
  );
}
