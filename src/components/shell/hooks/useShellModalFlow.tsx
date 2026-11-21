import { useCallback, useEffect, useRef, useState } from "react";
import { Text } from "react-native";
import { CHANGELOG_DATE, CHANGELOG_MARKDOWN } from "../../../lib/changelog";
import {
  type ChangelogSource,
  readChangelogPrefs,
  writeChangelogPrefs,
} from "../../../lib/changelogPrefs";
import { IS_TAURI } from "../../../lib/desktop";
import { CHROME_FONT } from "../../../lib/fonts";
import {
  registerOpenChangelog,
  registerOpenSettingsSection,
} from "../../../lib/modalBridge";
import type { SettingsSectionId } from "../../../lib/settings";
import {
  defineThemedStyles,
  useThemedStyles,
} from "../../../lib/theme/themedStyles";
import type { WindowControlStyleId } from "../../../lib/windowDecorations";
import { SettingsScreen } from "../../../screens/SettingsScreen";
import { ChangelogScreen } from "../../changelog/ChangelogScreen";
import { AppModal } from "../AppModal";
import type { ModalType } from "../Sidebar";

export function useShellModalFlow(args: {
  appVersion: string;
  settingsMobile: boolean;
  windowControlStyle: WindowControlStyleId;
  setWindowControlStyle: (style: WindowControlStyleId) => void;
  changelogVersionStyle: object;
}) {
  const {
    appVersion,
    settingsMobile,
    windowControlStyle,
    setWindowControlStyle,
    changelogVersionStyle,
  } = args;
  const dateStyles = useThemedStyles(modalFlowStyles);

  const [modal, setModal] = useState<ModalType | null>(null);
  // a specific settings section the global palette requested (e.g. landed
  // on Typography); null means the modal opens on its entry-point section
  const [settingsSection, setSettingsSection] =
    useState<SettingsSectionId | null>(null);
  // the changelog's source: null shows the vendored RELEASE.md notes, and an
  // object carries the desktop updater's pending-release body until it lands
  const [changelogSource, setChangelogSource] =
    useState<ChangelogSource | null>(null);
  // the changelog footer's don't-show-again flag, loaded with the marker
  const [changelogSuppress, setChangelogSuppress] = useState(false);

  const changelogSuppressRef = useRef(changelogSuppress);
  changelogSuppressRef.current = changelogSuppress;
  const changelogSourceRef = useRef<ChangelogSource | null>(changelogSource);
  changelogSourceRef.current = changelogSource;

  // opening the notes counts them as seen for the shown version (the write
  // happens here, at open, so Esc/back/system paths cannot skip the notes):
  // once the running bundle carries that version the auto-open below stays
  // quiet, which is exactly what a web deploy or the desktop updater lands
  const openChangelog = useCallback(
    (source: ChangelogSource | null) => {
      changelogSourceRef.current = source;
      setChangelogSource(source);
      setModal("changelog");
      void writeChangelogPrefs({
        seen: source?.version ?? appVersion,
        suppress: changelogSuppressRef.current,
      });
    },
    [appVersion],
  );

  // the changelog footer wrangles don't-show-again and persists it against
  // the version whose notes are on screen
  const setChangelogSuppressPref = useCallback(
    (suppress: boolean) => {
      changelogSuppressRef.current = suppress;
      setChangelogSuppress(suppress);
      void writeChangelogPrefs({
        seen: changelogSourceRef.current?.version ?? appVersion,
        suppress,
      });
    },
    [appVersion],
  );

  // the sidebar's changelog button opens the vendored notes through the same
  // path as the auto-popup (source reset, seen recorded), never the raw modal
  const handleOpenModal = useCallback(
    (type: ModalType) => {
      if (type === "changelog") {
        openChangelog(null);
        return;
      }
      setModal(type);
    },
    [openChangelog],
  );

  // the global palette hands the settings modal a section to land on through
  // a module bridge (same pattern as the palette's own request route), since
  // the modal lives above the palette host in the provider tree
  useEffect(() => {
    registerOpenSettingsSection((section) => {
      setSettingsSection(section);
      setModal("settings");
    });
    return () => registerOpenSettingsSection(null);
  }, []);

  // the update banner and sidebar sit below the modal, so opening the notes
  // goes through a module bridge exactly like the settings section; the shell
  // chose the source and owns the after-update popup
  useEffect(() => {
    registerOpenChangelog((source) => {
      openChangelog(source);
    });
    return () => registerOpenChangelog(null);
  }, [openChangelog]);

  // open the changelog by itself after an update: a marker naming an older
  // version than the one now running means the running release's notes are
  // new to the user. a missing marker is a first launch, which records the
  // version silently instead, so a fresh install never pops up. web builds
  // read the deployed bundle's version, desktop the binary's; both keep the
  // marker where the platform does not wipe it per release (localStorage on
  // web, a data-dir file on desktop).
  useEffect(() => {
    let cancelled = false;
    void readChangelogPrefs().then((prefs) => {
      if (cancelled) return;
      changelogSuppressRef.current = prefs.suppress;
      setChangelogSuppress(prefs.suppress);
      if (prefs.seen === null) {
        void writeChangelogPrefs({
          seen: appVersion,
          suppress: prefs.suppress,
        });
        return;
      }
      if (prefs.seen !== appVersion && !prefs.suppress) {
        openChangelog(null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [appVersion, openChangelog]);

  const closeModal = useCallback(() => {
    setModal(null);
    setSettingsSection(null);
    setChangelogSource(null);
  }, []);

  const modalContent = (() => {
    switch (modal) {
      // install, settings, about, and help all open the same settings modal;
      // the sidebar button sets which section the modal starts on
      case "settings":
      case "install":
      case "about":
      case "help":
        return (
          <AppModal
            title="Settings"
            onClose={closeModal}
            width={1040}
            height={900}
            stretchBody
            titleBar={false}
          >
            <SettingsScreen
              mobile={settingsMobile}
              onClose={closeModal}
              initialSection={settingsSection ?? modal}
              showWindowControls={IS_TAURI}
              windowControlStyle={windowControlStyle}
              onWindowControlStyleChange={setWindowControlStyle}
            />
          </AppModal>
        );
      case "changelog": {
        const changelogVersion = changelogSource?.version ?? appVersion;
        return (
          <AppModal
            title={
              <>
                BCP
                <Text style={changelogVersionStyle}> {changelogVersion}</Text>
              </>
            }
            titleLabel={`BCP ${changelogVersion}`}
            headerAccessory={
              changelogSource ? undefined : (
                <Text style={dateStyles.changelogDate}>{CHANGELOG_DATE}</Text>
              )
            }
            onClose={closeModal}
            width={640}
            height={640}
            stretchBody
          >
            <ChangelogScreen
              markdown={changelogSource?.markdown ?? CHANGELOG_MARKDOWN}
              suppress={changelogSuppress}
              onToggleSuppress={setChangelogSuppressPref}
              onDone={closeModal}
            />
          </AppModal>
        );
      }
      default:
        return null;
    }
  })();

  return {
    modal,
    setModal,
    settingsSection,
    setSettingsSection,
    changelogSource,
    setChangelogSource,
    changelogSuppress,
    openChangelog,
    handleOpenModal,
    closeModal,
    modalContent,
  };
}

const modalFlowStyles = defineThemedStyles({
  changelogDate: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 12,
    color: "var(--text-secondary)",
    marginRight: 8,
    flexShrink: 0,
  },
});
