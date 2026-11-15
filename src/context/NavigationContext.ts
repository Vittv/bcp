import { createContext, useContext } from "react";
import type { PageId } from "../components/shell/Sidebar";
import type { CollectSel } from "../screens/reference/shared";

export type NavigateToRef = {
  page: PageId;
  bookAbbrev?: string;
  chapter?: number;
  psalm?: number;
  psalterDay?: number;
  collect?: CollectSel;
  saint?: string;
  lesserFeast?: string;
  proverb?: number;
  canticle?: number;
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
