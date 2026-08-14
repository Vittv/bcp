#!/usr/bin/env python3
"""Extract the 150 psalms from the public-domain BCP E-text psalter files.

Reads bcpsalt1.txt and bcpsalt2.txt from the sources directory and emits
psalter.min.json into the repo vendor directory.
"""

import json
import re

from paths import SOURCES, VENDOR

PSALM_START = re.compile(r"^<Psalm (\d+)(?:: Part II)?>\s*(?:=.*)?$")
PART_I = re.compile(r"^<Part I>\s*(?:=.*)?$")
HEBREW = re.compile(r"^<([A-Z][a-z]+)>\s*(?:=.*)?$")
VERSE = re.compile(r"^(\d+)  (.*)$")
PAGE = re.compile(r"^<page \d+>$")

psalms = {}
current = None
current_part = None
verse_no = 0


def add_verse(text):
    global verse_no
    if current_part is None:
        add_part("")
    current_part.setdefault("verses", {})[str(verse_no)] = text


def start_psalm(number):
    global current, current_part, verse_no
    current = psalms.setdefault(number, {"parts": []})
    current_part = None
    verse_no = 0


def add_part(title):
    global current_part
    current_part = {"title": title.strip(), "verses": {}}
    current["parts"].append(current_part)


def append_verse_text(extra):
    if current_part is None:
        add_part("")
    verses = current_part["verses"]
    key = str(verse_no)
    verses[key] = verses[key] + " " + extra


def add_heading(letter):
    # Hebrew stanza letters (Psalm 119) mark the verse that follows.
    if current_part is None:
        add_part("")
    if "stanzas" not in current_part:
        current_part["stanzas"] = {}
    current_part["stanzas"][str(verse_no + 1)] = letter


for path in [SOURCES / "bcpsalt1.txt", SOURCES / "bcpsalt2.txt"]:
    in_psalter = False
    for line in open(path).read().split("\n"):
        m = PSALM_START.match(line.strip())
        if m and not in_psalter:
            in_psalter = True
        if not in_psalter:
            continue
        m = PSALM_START.match(line.strip())
        if m:
            start_psalm(int(m.group(1)))
            continue
        if PART_I.match(line.strip()):
            add_part("")
            continue
        if current is None:
            continue
        if HEBREW.match(line.strip()):
            add_heading(HEBREW.match(line.strip()).group(1))
            continue
        if PAGE.match(line.strip()):
            continue
        if line.strip() == "":
            continue
        v = VERSE.match(line)
        if v:
            verse_no = int(v.group(1))
            add_verse(v.group(2))
            continue
        # continuation of the current verse; a leading '/' is a mid-word
        # line break, otherwise the line was wrapped at a word boundary.
        extra = line[1:] if line.startswith("/") else line
        append_verse_text(extra.strip())

result = {}
for number in sorted(psalms):
    parts = []
    for p in psalms[number]["parts"]:
        parts.append(
            {
                "title": p["title"] or None,
                "verses": p["verses"],
                **({"stanzas": p["stanzas"]} if "stanzas" in p else {}),
            }
        )
    result[str(number)] = {"parts": parts}

out = open(VENDOR / "psalter.min.json", "w")
json.dump(result, out, ensure_ascii=False, separators=(",", ":"))
out.close()

print("psalms:", len(result))
total = sum(len(p["verses"]) for ps in result.values() for p in ps["parts"])
print("verses:", total)
for n in ["1", "18", "78", "89", "105", "106", "107", "119", "150"]:
    ps = result[n]
    parts = ps["parts"]
    counts = [len(p["verses"]) for p in parts]
    ranges = [
        f"{min(map(int, p['verses']))}-{max(map(int, p['verses']))}"
        for p in parts
    ]
    print(f"psalm {n}: {len(parts)} part(s), verses {counts}, ranges {ranges}")
    if "stanzas" in psalms.get(n, {}).get("parts", [{}])[0]:
        print("  stanzas:", psalms[n]["parts"][0]["stanzas"])
