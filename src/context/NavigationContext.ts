import { createContext, useContext } from "react";
import type { PageId } from "../components/shell/Sidebar";

export type NavigateToRef = {
  page: PageId;
  bookAbbrev?: string;
  chapter?: number;
};

type NavigationState = {
  navigateTo: (target: NavigateToRef | PageId) => void;
};

export const NavigationContext = createContext<NavigationState>({
  navigateTo: () => {},
});

export function useNavigation(): NavigationState {
  return useContext(NavigationContext);
}
