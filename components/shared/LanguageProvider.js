"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getDictionary, DEFAULT_LANG, LANG_META, SUPPORTED, t as translate } from "@/lib/i18n";

const LanguageContext = createContext(null);

function readInitialLang() {
  if (typeof window === "undefined") return DEFAULT_LANG;
  const stored = window.localStorage.getItem("ts_lang");
  if (stored && SUPPORTED.includes(stored)) return stored;
  const nav = window.navigator.language?.slice(0, 2);
  return SUPPORTED.includes(nav) ? nav : DEFAULT_LANG;
}

export function LanguageProvider({ children, initialLang = DEFAULT_LANG }) {
  const [lang, setLangState] = useState(initialLang);

  useEffect(() => {
    const initial = readInitialLang();
    if (initial !== lang) setLangState(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const meta = LANG_META[lang] || LANG_META[DEFAULT_LANG];
    document.documentElement.lang = lang;
    document.documentElement.dir = meta.dir;
  }, [lang]);

  const setLang = useCallback((next) => {
    if (!SUPPORTED.includes(next)) return;
    setLangState(next);
    window.localStorage.setItem("ts_lang", next);
  }, []);

  const dict = useMemo(() => getDictionary(lang), [lang]);
  const tr = useCallback((key, fallback) => translate(dict, key, fallback), [dict]);

  const value = useMemo(() => ({ lang, setLang, dict, tr, dir: LANG_META[lang].dir, meta: LANG_META }), [lang, setLang, dict, tr]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used inside <LanguageProvider>");
  return ctx;
}
