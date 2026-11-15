import type { ReactNode } from "react";

import {
  BibleIcon,
  BookIcon,
  BookmarkIcon,
  CalendarIcon,
  ClockIcon,
  CrossIcon,
  CrownIcon,
  ListIcon,
  MusicIcon,
  StarIcon,
  SunIcon,
} from "./Icon";

export const REPO_URL = "https://github.com/Vittv/bcp";

export type PageId =
  | "today"
  | "calendar"
  | "lectionary"
  | "psalms"
  | "psalter"
  | "collects"
  | "offices"
  | "saints"
  | "lesser-feasts"
  | "proverbs"
  | "canticles"
  | "old-testament"
  | "new-testament"
  | "apocrypha";

export type ModalType = "install" | "settings" | "about" | "help" | "changelog";

export type SidebarDetail = {
  text: string;
  // the detail is the day itself, not a countdown to it
  isToday?: boolean;
};

// nav rows: dimmed icons beside short labels, in three blocks separated by a
// hairline; the trailing detail (season, countdown...) stays right
export const NAV: {
  id: PageId;
  label: string;
  section?: string;
  icon: ReactNode;
}[] = [
  { id: "today", label: "Daily Office", icon: <BookIcon size={15} /> },
  { id: "calendar", label: "Calendar", icon: <CalendarIcon size={15} /> },
  { id: "lectionary", label: "Lectionary", icon: <ListIcon size={15} /> },
  { id: "offices", label: "Offices", icon: <ClockIcon size={15} /> },
  {
    id: "canticles",
    label: "Canticles",
    section: "reference",
    icon: <MusicIcon size={15} />,
  },
  {
    id: "collects",
    label: "Collects",
    section: "reference",
    icon: <CrossIcon size={15} />,
  },
  {
    id: "saints",
    label: "Holy Days",
    section: "reference",
    icon: <StarIcon size={15} />,
  },
  // the optional calendar beside the Holy Days it yields to
  {
    id: "lesser-feasts",
    label: "Lesser Feasts",
    section: "reference",
    icon: <SunIcon size={15} />,
  },
  // last in the reference block: the cycle reads as a companion to the
  // canonical Psalms index that opens the scripture block below it
  {
    id: "psalter",
    label: "30-Day Psalter",
    section: "reference",
    icon: <BookmarkIcon size={15} />,
  },
  {
    id: "psalms",
    label: "Psalms",
    section: "scripture",
    icon: <BookmarkIcon size={15} />,
  },
  {
    id: "proverbs",
    label: "Proverbs",
    section: "scripture",
    icon: <CrownIcon size={15} />,
  },
  {
    id: "old-testament",
    label: "Old Testament",
    section: "scripture",
    icon: <BibleIcon size={15} />,
  },
  {
    id: "new-testament",
    label: "New Testament",
    section: "scripture",
    icon: <BibleIcon size={15} />,
  },
  // last of the scripture block, the way an appendix goes last in a table
  // of contents. the label carries the distinction, so the row needs no
  // dimming or divider of its own: the row also carries active state
  {
    id: "apocrypha",
    label: "Apocrypha",
    section: "scripture",
    icon: <BibleIcon size={15} />,
  },
];

// group order; the blocks are separated by a hairline, not titled
export const SECTIONS = ["", "reference", "scripture"] as const;

export const noSelect = {
  userSelect: "none" as const,
  WebkitUserSelect: "none" as const,
};
