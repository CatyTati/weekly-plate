// Navigation helpers shared by screens: switch main view, open a screen on top, open the menu.
import { createContext, useContext } from 'react';

export const MAIN_TABS = ['home', 'week', 'feed', 'shop'];
export const NavCtx = createContext({});
export const useNav = () => useContext(NavCtx);
