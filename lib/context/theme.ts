import { createContext, useContext } from 'react';

import { Callback, CallbackParam } from 'lib/model/callback';

export type Theme = 'system' | 'dark' | 'light';
export interface ThemeContextType {
  theme: Theme;
  setTheme: Callback<Theme>;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  setTheme: (param: CallbackParam<Theme>) => {},
});

export function useTheme(): ThemeContextType {
  return useContext(ThemeContext);
}
