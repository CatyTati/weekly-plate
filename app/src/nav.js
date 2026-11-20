// Navigation helpers shared by screens: switch main view, open a screen on top, open the menu.
import { createContext, useContext } from 'react';

export const MAIN_TABS = ['home', 'week', 'feed', 'shop'];
export const NavCtx = createContext({});
export const useNav = () => useContext(NavCtx);
// True while the bottom tab bar is shown: it already keeps clear of the system navigation bar.
export const TabBarCtx = createContext(false);
export const useHasTabBar = () => useContext(TabBarCtx);
