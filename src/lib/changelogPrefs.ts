// where the changelog modal keeps "which notes has the user seen", so it can
// open only after a real version change and never on a first launch. web
// builds store it in localStorage, which is stable per origin; the desktop
// shell keeps it in a data-dir file instead, because the windows webview
// sweep clears all browsing data once per released version and would reset
// a localStorage marker on every update.
import { IS_TAURI } from "./desktop";

export type ChangelogPrefs = {
  /** the last version whose notes the user saw; null means never seen */
  seen: string | null;
  /** the user asked never to auto-open the notes on future updates */
  suppress: boolean;
};

/** notes shown come either from the bundle or from the pending updater body */
export type ChangelogSource = {
  markdown: string;
  version: string;
};

const WEB_KEY = "changelogPrefs";

function parsePrefs(raw: string | null): ChangelogPrefs {
  if (!raw) return { seen: null, suppress: false };
  try {
    // SAFETY: each field is re-checked through the accessors below, so a
    // malformed blob degrades to the defaults instead of crashing the launch
    const parsed = JSON.parse(raw) as Partial<ChangelogPrefs>;
    return {
      seen: typeof parsed.seen === "string" ? parsed.seen : null,
      suppress: parsed.suppress === true,
    };
  } catch {
    return { seen: null, suppress: false };
  }
}

export async function readChangelogPrefs(): Promise<ChangelogPrefs> {
  if (IS_TAURI) {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      return parsePrefs(await invoke<string>("get_changelog_prefs"));
    } catch {
      return { seen: null, suppress: false };
    }
  }
  if (typeof localStorage === "undefined")
    return { seen: null, suppress: false };
  return parsePrefs(localStorage.getItem(WEB_KEY));
}

export async function writeChangelogPrefs(
  prefs: ChangelogPrefs,
): Promise<void> {
  const raw = JSON.stringify(prefs);
  if (IS_TAURI) {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("set_changelog_prefs", { prefs: raw });
    } catch {
      // the marker is a nicety, never a reason to fail the launch
    }
    return;
  }
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(WEB_KEY, raw);
}

// module bridge mirroring requestOpenSettingsSection: the update banner and
// the sidebar live below the shell's modal state, so opening the changelog
// (and which notes to show) goes through the shell
let openHandler: ((source: ChangelogSource | null) => void) | null = null;

export function requestOpenChangelog(source: ChangelogSource | null): void {
  openHandler?.(source);
}

export function registerOpenChangelog(
  handler: ((source: ChangelogSource | null) => void) | null,
): void {
  openHandler = handler;
}
