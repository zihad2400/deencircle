"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext(null);
const STORAGE_KEY = "ts_theme";
const VALID = ["light", "dark", "system"];

function applyTheme(mode) {
  const root = document.documentElement;
  const isDark = mode === "dark" ||
    (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", isDark);
  root.dataset.theme = mode;
}

export function ThemeProvider({ children, defaultMode = "system" }) {
  const [mode, setModeState] = useState(defaultMode);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const initial = VALID.includes(stored) ? stored : defaultMode;
    setModeState(initial);
    applyTheme(initial);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => {
      if (document.documentElement.dataset.theme === "system") applyTheme("system");
    };
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, [defaultMode]);

  const setMode = useCallback((next) => {
    if (!VALID.includes(next)) return;
    setModeState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  }, []);

  const value = useMemo(() => ({ mode, setMode }), [mode, setMode]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
