import React, { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Rubik_300Light, Rubik_400Regular, Rubik_500Medium } from '@expo-google-fonts/rubik';
import { StoreProvider, useStore } from './src/store';
import { color } from './src/theme';
import { TabBar } from './src/components/ui';
import Onboarding from './src/screens/Onboarding';
import Week from './src/screens/Week';
import Shop from './src/screens/Shop';
import Prep from './src/screens/Prep';
import Recipes from './src/screens/Recipes';
import RecipeDetail from './src/screens/RecipeDetail';
import AddRecipe from './src/screens/AddRecipe';
import Community from './src/screens/Community';

function Root() {
  const { ready, state, rtl } = useStore();
  const [tab, setTab] = useState('week');
  const [stack, setStack] = useState([]); // screens opened on top of a tab

  if (!ready) return <View style={{ flex: 1, backgroundColor: color.bg, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={color.accent} /></View>;

  const open = (screen, params = {}) => setStack(s => [...s, { screen, params }]);
  const back = () => setStack(s => s.slice(0, -1));
  const top = stack[stack.length - 1];

  let body;
  if (!state.onboarded) body = <Onboarding />;
  else if (top?.screen === 'recipe') body = <RecipeDetail id={top.params.id} back={back} />;
  else if (top?.screen === 'add') body = <AddRecipe back={back} />;
  else if (top?.screen === 'prep') body = <Prep back={back} />;
  else if (tab === 'week') body = <Week open={open} />;
  else if (tab === 'shop') body = <Shop />;
  else if (tab === 'recipes') body = <Recipes open={open} />;
  else body = <Community goWeek={() => setTab('week')} />;

  return (
    // `direction` mirrors every row for Hebrew without restarting the app.
    <View style={{ flex: 1, backgroundColor: color.bg, direction: rtl ? 'rtl' : 'ltr' }}>
      <StatusBar style="dark" />
      <View style={{ flex: 1 }}>{body}</View>
      {state.onboarded && !top ? <TabBar tab={tab} onTab={k => { setStack([]); setTab(k); }} /> : null}
    </View>
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
