import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";

import type { OfficeId } from "../lib/content/types";
import {
  EMPTY_CUSTOMIZATION,
  type OfficeCustomization,
  type OfficeCustomizations,
} from "../lib/office/customization";
import type { OfficeRite } from "../lib/office/types";
import {
  applyOfficeChoice,
  customizationFor as customizationForState,
  DEFAULT_DEVOTIONS,
  DEFAULT_RITE,
  DEFAULT_RUBRICS,
  DEFAULT_SPEAKERS,
  KEY_DEVOTIONS,
  KEY_RUBRICS,
  KEY_SPEAKERS,
  loadBoolean,
  loadCustomizations,
  loadRite,
  persistBoolean,
  persistCustomizations,
  persistRite,
  removeOfficeCustomization,
  type ToggleUpdate,
} from "./OfficeSettingsContext.storage";

// how the daily office reads on screen. rubrics, speakers, rite and devotions
// are persistence toggles surfaced both in the office bar and in Settings, so
// they live in one source of truth here (the same role TranslationContext
// plays for the Bible translation). devotions swaps the full office for the
// short office. inline choices for each office are stored here too: only the
// reader's explicit overrides live in storage, so the printed defaults keep
// following the calendar.

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
    loadBoolean(KEY_RUBRICS, DEFAULT_RUBRICS),
  );
  const [showSpeakers, setShowSpeakersState] = useState(() =>
    loadBoolean(KEY_SPEAKERS, DEFAULT_SPEAKERS),
  );
  const [devotions, setDevotionsState] = useState(() =>
    loadBoolean(KEY_DEVOTIONS, DEFAULT_DEVOTIONS),
  );
  const [rite, setRiteState] = useState(loadRite);
  const [customizations, setCustomizations] =
    useState<OfficeCustomizations>(loadCustomizations);

  const setShowRubrics = useCallback((update: ToggleUpdate) => {
    setShowRubricsState((prev) => {
      const next = typeof update === "function" ? update(prev) : update;
      persistBoolean(KEY_RUBRICS, next);
      return next;
    });
  }, []);
  const setShowSpeakers = useCallback((update: ToggleUpdate) => {
    setShowSpeakersState((prev) => {
      const next = typeof update === "function" ? update(prev) : update;
      persistBoolean(KEY_SPEAKERS, next);
      return next;
    });
  }, []);
  const setDevotions = useCallback((v: boolean) => {
    setDevotionsState(v);
    persistBoolean(KEY_DEVOTIONS, v);
  }, []);
  const setRite = useCallback((r: OfficeRite) => {
    setRiteState(r);
    persistRite(r);
  }, []);
  const customizationFor = useCallback(
    (officeId: OfficeId) => customizationForState(customizations, officeId),
    [customizations],
  );
  const setOfficeChoice = useCallback(
    (officeId: OfficeId, patch: Partial<OfficeCustomization>) => {
      setCustomizations((prev) => {
        const next = applyOfficeChoice(prev, officeId, patch);
        persistCustomizations(next);
        return next;
      });
    },
    [],
  );
  const resetOffice = useCallback((officeId: OfficeId) => {
    setCustomizations((prev) => {
      const next = removeOfficeCustomization(prev, officeId);
      if (!next) return prev;
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
