"use client";

import { useState, useRef, useEffect } from "react";
import { useLang } from "@/components/shared/LanguageProvider";
import { SUPPORTED, LANG_META } from "@/lib/i18n";

export default function LanguageSwitcher({ mobile = false }) {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const currentMeta = LANG_META[lang] || LANG_META["en"];

  return (
    <div ref={ref} className={`relative ${mobile ? 'w-full' : ''}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 rounded-ts-sm border border-ts-border bg-ts-surface px-3 py-1.5 text-sm hover:bg-ts-surface-2 transition-colors ${mobile ? 'w-full justify-between' : ''}`}
      >
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
          <span className="font-medium">{currentMeta.label}</span>
        </div>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div className={`absolute z-50 mt-1 w-48 max-h-64 overflow-y-auto rounded-ts-lg border border-ts-border bg-ts-surface shadow-ts-2 py-1 animate-in fade-in slide-in-from-top-2 duration-200 ${mobile ? 'left-0 w-full' : 'right-0'}`}>
          {SUPPORTED.map((code) => (
            <button
              key={code}
              onClick={() => { setLang(code); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-ts-surface-2 transition-colors ${lang === code ? 'bg-ts-primary-soft text-ts-primary font-medium' : 'text-ts-text'}`}
            >
              <span>{LANG_META[code].label}</span>
              {lang === code && (
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
