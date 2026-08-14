#!/usr/bin/env python3
"""Extract canticles 1-21 from the public-domain BCP E-text office file.

Reads bcpoffce.txt from the sources directory and emits canticles.min.json
into the repo vendor directory.
"""

import json
import re

from paths import SOURCES, VENDOR

CANTICLE = re.compile(r"^<Canticle (\d+)>  (.+?)  =(.*?)=$")
CANTICLE_SP1 = re.compile(r"^<Canticle (\d+)> (.+?)  =(.*?)=$")
CANTICLE_SP2 = re.compile(r"^<Canticle (\d+)>  (.+?) =(.*?)=$")
CANTICLE_NOTITLE = re.compile(r"^<Canticle (\d+)>  =(.*?)=$")
CANTICLE8 = re.compile(r"^<8 (.+?)>  =(.*?)=$")
SOURCE = re.compile(r"^=(.+?)=$")
PAGE = re.compile(r"^<page \d+>$")
CREED = re.compile(r"^<The Apostles' Creed>|^<The Apostle's Creed>")

canticles = {}
current = None
section = None
verses = []
current_verse = None
note_lines = None
star_mode = True


def flush_verse():
    global current_verse
    if current_verse is not None:
        verses.append(current_verse)
    current_verse = None


def flush_section():
    global verses
    flush_verse()
    if verses:
        current.setdefault("sections", []).append({"title": section, "verses": verses})
    verses = []


def new_verse(text):
    global current_verse
    flush_verse()
    current_verse = text


def extend_verse(text):
    global current_verse
    if current_verse is None:
        current_verse = text
    else:
        current_verse += " " + text


def start_canticle(number, title, latin):
    global current, section, verses, current_verse, star_mode, note_lines
    if current is not None:
        flush_section()
    current = {
        "number": number,
        "title": title,
        "latin": latin,
        "source": None,
        "note": None,
        "sections": [],
    }
    canticles[number] = current
    section = None
    verses = []
    current_verse = None
    note_lines = None
    # Gloria (6, 20) and Te Deum (7, 21) have no midpoint asterisks.
    star_mode = number not in (6, 7, 20, 21)


raw = open(SOURCES / "bcpoffce.txt").read().split("\n")

for line in raw:
    s = line.strip()
    m = CANTICLE.match(line)
    if m:
        start_canticle(int(m.group(1)), m.group(2), m.group(3))
        continue
    m = CANTICLE_SP1.match(line)
    if m:
        start_canticle(int(m.group(1)), m.group(2), m.group(3))
        continue
    m = CANTICLE_SP2.match(line)
    if m:
        start_canticle(int(m.group(1)), m.group(2), m.group(3))
        continue
    m = CANTICLE_NOTITLE.match(line)
    if m:
        start_canticle(int(m.group(1)), "A Song of Praise", m.group(2))
        continue
    m = CANTICLE8.match(line)
    if m:
        start_canticle(8, m.group(1), m.group(2))
        continue
    if current is None:
        continue
    if CREED.match(line):
        flush_section()
        current = None
        continue
    if s == "":
        flush_verse()
        continue
    if PAGE.match(line):
        continue
    if SOURCE.match(s) and current["source"] is None:
        current["source"] = s[1:-1]
        continue
    if s.startswith("*") and s.endswith("*") and current["note"] is None:
        current["note"] = s[1:-1]
        continue
    if s.startswith("*") and current["note"] is None:
        note_lines = [s[1:]]
        continue
    if note_lines is not None:
        note_lines.append(s)
        if s.endswith("*"):
            current["note"] = " ".join(note_lines)[:-1]
            note_lines = None
        continue
    if s.startswith("="):
        flush_section()
        section = s[1:-1]
        continue
    if line.startswith("/"):
        extend_verse(line[1:].strip())
        continue
    if star_mode:
        if s.endswith("*"):
            new_verse(s[:-1].strip())
        else:
            extend_verse(s)
    else:
        # no midpoints: each line is a verse; a line indented with a
        # leading space is a continuation of the previous verse.
        if line.startswith(" "):
            extend_verse(s)
        else:
            new_verse(s)

if current is not None:
    flush_section()

result = {}
for n in range(1, 22):
    c = canticles.get(n)
    if c is None:
        print(f"missing {n}")
        continue
    result[str(n)] = {
        "title": c["title"],
        "latin": c["latin"],
        "source": c["source"],
        "note": c.get("note"),
        "sections": c["sections"],
    }

out = open(VENDOR / "canticles.min.json", "w")
json.dump(result, out, ensure_ascii=False, separators=(",", ":"))
out.close()

for n in range(1, 22):
    c = canticles.get(n)
    if c is None:
        continue
    counts = [len(s["verses"]) for s in c["sections"]]
    total = sum(counts)
    print(f"{n}: {c['title'][:30]:32} total={total} sections={counts}")
