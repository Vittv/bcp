import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import type { Translation } from "../lib/content/bible";

type TranslationContextValue = {
  translation: Translation;
  setTranslation: (t: Translation) => void;
};

const STORAGE_KEY = "bcp-translation";

function loadTranslation(): Translation {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "kjv" || v === "web") return v;
  } catch {
    // ignore
  }
  // WEB is the default: the World English Bible is the most widely used
  // modern translation, and KJV remains one click away
  return "web";
}

function persistTranslation(t: Translation) {
  try {
    localStorage.setItem(STORAGE_KEY, t);
  } catch {
    // ignore
  }
}

const Ctx = createContext<TranslationContextValue>({
  translation: "web",
  setTranslation: () => {},
});

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [translation, setTranslationState] =
    useState<Translation>(loadTranslation);

  const setTranslation = useCallback((t: Translation) => {
    setTranslationState(t);
    persistTranslation(t);
  }, []);

  return (
    <Ctx.Provider value={{ translation, setTranslation }}>
      {children}
    </Ctx.Provider>
  );
}

export function useTranslation(): TranslationContextValue {
  return useContext(Ctx);
}
