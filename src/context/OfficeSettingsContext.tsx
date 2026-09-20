import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";

// how the daily office reads on screen. rubrics and speakers are persistence
// toggles surfaced both in the office bar and in Settings, so they live in
// one source of truth here (the same role TranslationContext plays for the
// Bible translation). devotions swaps the full office for the short office.

type ToggleUpdate = boolean | ((prev: boolean) => boolean);

type OfficeSettingsValue = {
  showRubrics: boolean;
  showSpeakers: boolean;
  devotions: boolean;
  setShowRubrics: (update: ToggleUpdate) => void;
  setShowSpeakers: (update: ToggleUpdate) => void;
  setDevotions: (v: boolean) => void;
};

const KEY_RUBRICS = "rubrics";
const KEY_SPEAKERS = "speakers";
const KEY_DEVOTIONS = "devotions";

// the printed book always carries rubrics and speakers, so a reader with no
// stored preference starts with both shown; an explicit off survives
const DEFAULT_RUBRICS = true;
const DEFAULT_SPEAKERS = true;
const DEFAULT_DEVOTIONS = false;

function load(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    if (v === "true" || v === "false") return v === "true";
  } catch {
    // ignore
  }
  return fallback;
}

function persist(key: string, v: boolean): void {
  try {
    localStorage.setItem(key, String(v));
  } catch {
    // ignore
  }
}

const Ctx = createContext<OfficeSettingsValue>({
  showRubrics: DEFAULT_RUBRICS,
  showSpeakers: DEFAULT_SPEAKERS,
  devotions: DEFAULT_DEVOTIONS,
  setShowRubrics: () => {},
  setShowSpeakers: () => {},
  setDevotions: () => {},
});

export function OfficeSettingsProvider({ children }: { children: ReactNode }) {
  const [showRubrics, setShowRubricsState] = useState(() =>
    load(KEY_RUBRICS, DEFAULT_RUBRICS),
  );
  const [showSpeakers, setShowSpeakersState] = useState(() =>
    load(KEY_SPEAKERS, DEFAULT_SPEAKERS),
  );
  const [devotions, setDevotionsState] = useState(() =>
    load(KEY_DEVOTIONS, DEFAULT_DEVOTIONS),
  );

  const setShowRubrics = useCallback((update: ToggleUpdate) => {
    setShowRubricsState((prev) => {
      const next = typeof update === "function" ? update(prev) : update;
      persist(KEY_RUBRICS, next);
      return next;
    });
  }, []);
  const setShowSpeakers = useCallback((update: ToggleUpdate) => {
    setShowSpeakersState((prev) => {
      const next = typeof update === "function" ? update(prev) : update;
      persist(KEY_SPEAKERS, next);
      return next;
    });
  }, []);
  const setDevotions = useCallback((v: boolean) => {
    setDevotionsState(v);
    persist(KEY_DEVOTIONS, v);
  }, []);

  return (
    <Ctx.Provider
      value={{
        showRubrics,
        showSpeakers,
        devotions,
        setShowRubrics,
        setShowSpeakers,
        setDevotions,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useOfficeSettings(): OfficeSettingsValue {
  return useContext(Ctx);
}
