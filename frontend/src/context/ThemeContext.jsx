import React, { createContext, useContext, useState } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => document.documentElement.dataset.theme === 'dark');
  const toggleTheme = () => {
    const next = !isDark;
    document.documentElement.dataset.theme = next ? 'dark' : 'light';
    localStorage.setItem('foodbridge-theme', next ? 'dark' : 'light');
    setIsDark(next);
  };
  return <ThemeContext.Provider value={{ isDark, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
