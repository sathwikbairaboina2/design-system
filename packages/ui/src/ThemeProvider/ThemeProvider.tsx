import { createContext, useContext, useMemo, useState, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../cx';
import s from './ThemeProvider.module.css';

export type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  /** The element carrying data-theme. Portals (Dialog) render into it so dark tokens apply. */
  container: HTMLElement | null;
}

const ThemeContext = createContext<ThemeContextValue>({ theme: 'light', container: null });

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

export interface ThemeProviderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  theme: Theme;
  children?: ReactNode;
}

export function ThemeProvider({ theme, children, className, ...rest }: ThemeProviderProps) {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const value = useMemo(() => ({ theme, container }), [theme, container]);
  return (
    <ThemeContext.Provider value={value}>
      <div {...rest} ref={setContainer} data-theme={theme} className={cx(s.root, className)}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
