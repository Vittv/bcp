import { Pressable, Text, View } from "react-native";
import { FontPicker } from "../../components/settings/FontPicker";
import { Slider } from "../../components/settings/Slider";
import { useThemedStyles } from "../../lib/theme/themedStyles";
import type { FaceDef } from "../../lib/typography/faces";
import {
  BASE_FONT_PX,
  DEFAULT_FONT_PX,
  FONT_SIZES,
  MAX_FONT_PX,
  MIN_FONT_PX,
} from "../../lib/typography/sizes";
import { settingsStyles } from "./settingsStyles";

// the in-situ page mock's copy: a passage from the Daily Office, carried by
// the same chrome line, heading, body, and rubric the reader shows
const MOCK_CHROME = "The Order for Morning Prayer";
const MOCK_HEADING = "Daily Morning Prayer";
const MOCK_SUBHEADING = "The First Song of Isaiah";
const MOCK_PASSAGE =
  "Our Father, who art in heaven, hallowed be thy Name, thy kingdom come, thy will be done, on earth as it is in heaven. Give us this day our daily bread. And forgive us our trespasses, as we forgive those who trespass against us.";
const MOCK_RUBRIC = "The People stand or kneel";

type TypographySettingsProps = {
  fontPx: number;
  setFontPx: (px: number) => void;
  interfaceFont: string;
  setInterfaceFont: (id: string) => void;
  headingFont: string;
  setHeadingFont: (id: string) => void;
  subheadingFont: string;
  setSubheadingFont: (id: string) => void;
  readingFont: string;
  setReadingFont: (id: string) => void;
  interfaceFaces: FaceDef[];
  headingFaces: FaceDef[];
  subheadingFaces: FaceDef[];
  readingFaces: FaceDef[];
  // return every role to its default face
  onResetFonts: () => void;
};

export function TypographySettings({
  fontPx,
  setFontPx,
  interfaceFont,
  setInterfaceFont,
  headingFont,
  setHeadingFont,
  subheadingFont,
  setSubheadingFont,
  readingFont,
  setReadingFont,
  interfaceFaces,
  headingFaces,
  subheadingFaces,
  readingFaces,
  onResetFonts,
}: TypographySettingsProps) {
  const styles = useThemedStyles(settingsStyles);
  // the specimen rides the reader's scale, so a size change is legible here
  const fontScale = fontPx / BASE_FONT_PX;
  const scaled = (size: number, lineHeight: number) => ({
    fontSize: size * fontScale,
    lineHeight: lineHeight * fontScale,
  });

  return (
    <>
      <View style={[styles.section, styles.sectionRaised, styles.sectionFlush]}>
        <View style={styles.groupRow}>
          <Text style={styles.groupLabel}>Font Family</Text>
          <Pressable
            onPress={onResetFonts}
            style={({ hovered }) => [
              styles.reset,
              hovered && styles.resetHover,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Reset font family"
          >
            <Text style={styles.resetText}>Default</Text>
          </Pressable>
        </View>
        {/* one field holds all three roles, the rows split by hairlines the
            way a system settings group reads */}
        <View style={styles.fontGroup}>
          <FontPicker
            label="UI Font"
            value={interfaceFont}
            options={interfaceFaces}
            onChange={setInterfaceFont}
            compact
            description="Buttons, menus, and chrome"
          />
          <View style={styles.fontGroupDivider} />
          <FontPicker
            label="Heading Font"
            value={headingFont}
            options={headingFaces}
            onChange={setHeadingFont}
            compact
            description="Page titles"
          />
          <View style={styles.fontGroupDivider} />
          <FontPicker
            label="Subheading Font"
            value={subheadingFont}
            options={subheadingFaces}
            onChange={setSubheadingFont}
            compact
            description="Block and section titles"
          />
          <View style={styles.fontGroupDivider} />
          <FontPicker
            label="Body Font"
            value={readingFont}
            options={readingFaces}
            onChange={setReadingFont}
            compact
            description="Main reading text"
          />
        </View>
      </View>

      <View style={styles.section}>
        {/* the family field's own frame already closes that group, so the size
            block needs no rule above it */}
        <View style={styles.groupRow}>
          <Text style={styles.groupLabel}>Font Size</Text>
          <Pressable
            onPress={() => setFontPx(DEFAULT_FONT_PX)}
            style={({ hovered }) => [
              styles.reset,
              hovered && styles.resetHover,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Reset font size"
          >
            <Text style={styles.resetText}>Reset</Text>
          </Pressable>
        </View>
        <View style={styles.sliderWrap}>
          <Slider
            value={fontPx}
            onChange={setFontPx}
            steps={FONT_SIZES}
            min={MIN_FONT_PX}
            max={MAX_FONT_PX}
          />
        </View>
        {/* the specimen under the size control: a page as the reader sets it,
            chrome, heading, prayer and rubric all at the chosen scale */}
        <View style={styles.preview}>
          <Text style={[styles.mockChrome, scaled(12, 18)]}>{MOCK_CHROME}</Text>
          <Text style={[styles.mockHeading, scaled(18, 24)]}>
            {MOCK_HEADING}
          </Text>
          <Text style={[styles.mockSubheading, scaled(16, 22)]}>
            {MOCK_SUBHEADING}
          </Text>
          <Text style={[styles.mockBody, scaled(16, 26)]}>{MOCK_PASSAGE}</Text>
          <Text style={[styles.mockRubric, scaled(14, 22)]}>{MOCK_RUBRIC}</Text>
        </View>
      </View>
    </>
  );
}
