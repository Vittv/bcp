import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";

import type { OfficeId } from "../lib/content/types";
import {
  applyCustomization,
  EMPTY_CUSTOMIZATION,
  type OfficeCustomization,
  type OfficeCustomizations,
  sanitizeCustomizations,
} from "../lib/office/customization";
import type { OfficeRite } from "../lib/office/types";

// how the daily office reads on screen. rubrics, speakers, rite and devotions
// are persistence toggles surfaced both in the office bar and in Settings, so
// they live in one source of truth here (the same role TranslationContext
// plays for the Bible translation). devotions swaps the full office for the
// short office. inline choices for each office are stored here too: only the
// reader's explicit overrides live in storage, so the printed defaults keep
// following the calendar.

type ToggleUpdate = boolean | ((prev: boolean) => boolean);

type OfficeSettingsValue = {
  showRubrics: boolean;
  showSpeakers: boolean;
  devotions: boolean;
  rite: OfficeRite;
  customizations: OfficeCustomizations;
  setShowRubrics: (update: ToggleUpdate) => void;
  setShowSpeakers: (update: ToggleUpdate) => void;
  setDevotions: (v: boolean) => void;
  setRite: (r: OfficeRite) => void;
  customizationFor: (officeId: OfficeId) => OfficeCustomization;
  setOfficeChoice: (
    officeId: OfficeId,
    patch: Partial<OfficeCustomization>,
  ) => void;
  resetOffice: (officeId: OfficeId) => void;
};

const KEY_RUBRICS = "rubrics";
const KEY_SPEAKERS = "speakers";
const KEY_DEVOTIONS = "devotions";
const KEY_RITE = "rite";
const KEY_CUSTOMIZATIONS = "office:customizations:v1";

// the printed book always carries rubrics and speakers, so a reader with no
// stored preference starts with both shown; an explicit off survives
const DEFAULT_RUBRICS = true;
const DEFAULT_SPEAKERS = true;
const DEFAULT_DEVOTIONS = false;
// the contemporary office is the default
const DEFAULT_RITE: OfficeRite = "Two";

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

function loadRite(): OfficeRite {
  try {
    const v = localStorage.getItem(KEY_RITE);
    if (v === "One" || v === "Two") return v;
  } catch {
    // ignore
  }
  return DEFAULT_RITE;
}

function persistRite(v: OfficeRite): void {
  try {
    localStorage.setItem(KEY_RITE, v);
  } catch {
    // ignore
  }
}

function loadCustomizations(): OfficeCustomizations {
  try {
    const raw = localStorage.getItem(KEY_CUSTOMIZATIONS);
    if (raw) return sanitizeCustomizations(JSON.parse(raw));
  } catch {
    // ignore
  }
  return {};
}

function persistCustomizations(v: OfficeCustomizations): void {
  try {
    localStorage.setItem(KEY_CUSTOMIZATIONS, JSON.stringify(v));
  } catch {
    // ignore
  }
}

const Ctx = createContext<OfficeSettingsValue>({
  showRubrics: DEFAULT_RUBRICS,
  showSpeakers: DEFAULT_SPEAKERS,
  devotions: DEFAULT_DEVOTIONS,
  rite: DEFAULT_RITE,
  customizations: {},
  setShowRubrics: () => {},
  setShowSpeakers: () => {},
  setDevotions: () => {},
  setRite: () => {},
  customizationFor: () => EMPTY_CUSTOMIZATION,
  setOfficeChoice: () => {},
  resetOffice: () => {},
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
  const [rite, setRiteState] = useState(loadRite);
  const [customizations, setCustomizations] =
    useState<OfficeCustomizations>(loadCustomizations);

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
  const setRite = useCallback((r: OfficeRite) => {
    setRiteState(r);
    persistRite(r);
  }, []);
  const customizationFor = useCallback(
    (officeId: OfficeId) => customizations[officeId] ?? EMPTY_CUSTOMIZATION,
    [customizations],
  );
  const setOfficeChoice = useCallback(
    (officeId: OfficeId, patch: Partial<OfficeCustomization>) => {
      setCustomizations((prev) => {
        const clean = applyCustomization(prev[officeId], patch);
        const next = { ...prev };
        if (Object.keys(clean).length === 0) {
          delete next[officeId];
        } else {
          next[officeId] = clean;
        }
        persistCustomizations(next);
        return next;
      });
    },
    [],
  );
  const resetOffice = useCallback((officeId: OfficeId) => {
    setCustomizations((prev) => {
      if (!(officeId in prev)) return prev;
      const next = { ...prev };
      delete next[officeId];
      persistCustomizations(next);
      return next;
    });
  }, []);

  return (
    <Ctx.Provider
      value={{
        showRubrics,
        showSpeakers,
        devotions,
        rite,
        customizations,
        setShowRubrics,
        setShowSpeakers,
        setDevotions,
        setRite,
        customizationFor,
        setOfficeChoice,
        resetOffice,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useOfficeSettings(): OfficeSettingsValue {
  return useContext(Ctx);
}
