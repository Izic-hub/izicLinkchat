import React, { createContext, useContext, useEffect, useState } from "react";

export const THEMES = ["light", "dark", "sunset", "ocean"];
export const THEME_LABELS = { light: "Light", dark: "Dark", sunset: "Sunset", ocean: "Ocean" };

const ThemeContext = createContext({ theme: "light", setTheme: () => {}, themes: THEMES });

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("linkchat-theme") : null;
    return THEMES.includes(saved) ? saved : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("linkchat-theme", theme);
  }, [theme]);

  function setTheme(next) {
    if (THEMES.includes(next)) setThemeState(next);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
