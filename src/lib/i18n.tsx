"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useSyncExternalStore,
} from "react";

export type Lang = "en" | "zh";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
};

const LanguageContext = createContext<Ctx | null>(null);

const STORAGE_KEY = "crabai-lang";

// useSyncExternalStore is the React 19 / Next.js 16-recommended hook for
// reading from an external store (localStorage). It uses getServerSnapshot
// during SSR and the initial hydration render, then switches to
// getClientSnapshot on the next tick — so there's no hydration mismatch
// and no need for a manual mounted flag.
function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getClientSnapshot(): Lang {
  const saved = window.localStorage.getItem(STORAGE_KEY) as Lang | null;
  return saved === "en" || saved === "zh" ? saved : "en";
}

function getServerSnapshot(): Lang {
  return "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const lang = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);

  const setLang = (l: Lang) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, l);
    // Dispatch a synthetic storage event so useSyncExternalStore re-reads
    // within the same tab (the native storage event only fires in other tabs).
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY, newValue: l }));
  };

  const toggle = () => setLang(lang === "en" ? "zh" : "en");

  // Keep <html lang> attribute in sync (this is a side effect, not a state update).
  useEffect(() => {
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggle }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang(): Ctx {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Fallback so server-rendered or out-of-provider components don't crash.
    return {
      lang: "en",
      setLang: () => {},
      toggle: () => {},
    };
  }
  return ctx;
}
