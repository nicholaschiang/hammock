import { createContext, useContext } from 'react';

import { Callback } from 'lib/model/callback';

export type Theme = 'system' | 'dark' | 'light';
export interface ThemeContextType {
  theme: Theme;
  setTheme: Callback<Theme>;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  setTheme: () => {},
});

export function useTheme(): ThemeContextType {
  return useContext(ThemeContext);
}
