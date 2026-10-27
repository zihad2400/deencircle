import en from "@/messages/en.json";
import bn from "@/messages/bn.json";
import ar from "@/messages/ar.json";
import ur from "@/messages/ur.json";
import hi from "@/messages/hi.json";
import es from "@/messages/es.json";
import fr from "@/messages/fr.json";
import tr from "@/messages/tr.json";
import id from "@/messages/id.json";
import ru from "@/messages/ru.json";
import zh from "@/messages/zh.json";

export const dictionaries = { en, bn, ar, ur, hi, es, fr, tr, id, ru, zh };

export const LANG_META = {
  en: { dir: "ltr", label: "English" },
  bn: { dir: "ltr", label: "বাংলা" },
  ar: { dir: "rtl", label: "العربية" },
  ur: { dir: "rtl", label: "اردو" },
  hi: { dir: "ltr", label: "हिन्दी" },
  es: { dir: "ltr", label: "Español" },
  fr: { dir: "ltr", label: "Français" },
  tr: { dir: "ltr", label: "Türkçe" },
  id: { dir: "ltr", label: "Bahasa Indonesia" },
  ru: { dir: "ltr", label: "Русский" },
  zh: { dir: "ltr", label: "中文" },
};

// সিরিয়াল অনুযায়ী সাজানো (ইংরেজি, বাংলা, আরবি আগে)
export const SUPPORTED = ["en", "bn", "ar", "ur", "hi", "es", "fr", "tr", "id", "ru", "zh"];
export const DEFAULT_LANG = "en";

export function getDictionary(lang) {
  return dictionaries[lang] || dictionaries[DEFAULT_LANG];
}

export function t(dict, key, fallback) {
  const parts = key.split(".");
  let cur = dict;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in cur) cur = cur[p];
    else return fallback ?? key;
  }
  return typeof cur === "string" ? cur : fallback ?? key;
}
