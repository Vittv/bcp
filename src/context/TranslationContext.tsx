import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import type { ApocryphaCorpus, Translation } from "../lib/content/bible";

type TranslationContextValue = {
  translation: Translation;
  setTranslation: (t: Translation) => void;
  apocrypha: ApocryphaCorpus;
  setApocrypha: (a: ApocryphaCorpus) => void;
};

const STORAGE_KEY = "bcp-translation";
const APOCRYPHA_STORAGE_KEY = "bcp-apocrypha";

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

function loadApocrypha(): ApocryphaCorpus {
  try {
    const v = localStorage.getItem(APOCRYPHA_STORAGE_KEY);
    if (v === "kjva" || v === "web") return v;
  } catch {
    // ignore
  }
  // WEB is the default here too, so a reader's experience does not change
  // until they choose the 1611 apocrypha
  return "web";
}

function persistTranslation(t: Translation) {
  try {
    localStorage.setItem(STORAGE_KEY, t);
  } catch {
    // ignore
  }
}

function persistApocrypha(a: ApocryphaCorpus) {
  try {
    localStorage.setItem(APOCRYPHA_STORAGE_KEY, a);
  } catch {
    // ignore
  }
}

const Ctx = createContext<TranslationContextValue>({
  translation: "web",
  setTranslation: () => {},
  apocrypha: "web",
  setApocrypha: () => {},
});

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [translation, setTranslationState] =
    useState<Translation>(loadTranslation);
  const [apocrypha, setApocryphaState] =
    useState<ApocryphaCorpus>(loadApocrypha);

  const setTranslation = useCallback((t: Translation) => {
    setTranslationState(t);
    persistTranslation(t);
  }, []);

  const setApocrypha = useCallback((a: ApocryphaCorpus) => {
    setApocryphaState(a);
    persistApocrypha(a);
  }, []);

  return (
    <Ctx.Provider
      value={{ translation, setTranslation, apocrypha, setApocrypha }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useTranslation(): TranslationContextValue {
  return useContext(Ctx);
}
