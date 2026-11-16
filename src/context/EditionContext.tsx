import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import { readStorageString, writeStorageString } from "../lib/storage";

export type BcpEdition = "1979" | "1662";

const STORAGE_KEY = "bcp-edition";

function loadEdition(): BcpEdition {
  const v = readStorageString(STORAGE_KEY);
  if (v === "1979" || v === "1662") return v;
  return "1979";
}

function persistEdition(e: BcpEdition): void {
  writeStorageString(STORAGE_KEY, e);
}

type EditionContextValue = {
  edition: BcpEdition;
  setEdition: (e: BcpEdition) => void;
};

const Ctx = createContext<EditionContextValue>({
  edition: "1979",
  setEdition: () => {},
});

export function EditionProvider({ children }: { children: ReactNode }) {
  const [edition, setEditionState] = useState<BcpEdition>(loadEdition);

  const setEdition = useCallback((e: BcpEdition) => {
    setEditionState(e);
    persistEdition(e);
  }, []);

  return (
    <Ctx.Provider value={{ edition, setEdition }}>{children}</Ctx.Provider>
  );
}

export function useEdition(): EditionContextValue {
  return useContext(Ctx);
}
