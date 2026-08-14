#!/usr/bin/env python3
"""Parse Wikisource Traditional collects text into {title: [body lines]}.

Reads the Wikisource capture (wikisource_trad_raw.txt) from the sources
directory and emits wikisource_trad.json into the scratch directory.
"""

import json
import re

from paths import SCRATCH, SOURCES

raw = open(SOURCES / "wikisource_trad_raw.txt").read()
lines = raw.split("\n")
content = [l for l in lines if l.strip()]
content = content[content.index("First Sunday of Advent  "):]

STOP = re.compile(r"^Preface of|^or the following|^or this$")

collects = {}
order = []
cur_title = None
cur_body = []

def flush():
    global cur_title, cur_body
    if cur_title and cur_body:
        txt = " ".join(cur_body)
        txt = re.sub(r"\s+", " ", txt).replace("\u200b", " ").replace("\u00a0", " ").strip()
        collects.setdefault(cur_title, []).append(txt)
    cur_title, cur_body = None, []

for ln in content:
    raw_s = ln
    s = raw_s.strip()
    if not s:
        continue
    if STOP.match(s):
        continue
    # title lines: in source end with two trailing spaces; body lines too but titles
    # are short and don't end with '.', ':', or 'Amen.'
    if raw_s.endswith("  ") and not s.endswith((".", ":", "Amen.", ";", ",")) and len(s) < 90:
        flush()
        t = s
        t = re.sub(
            r"\s*(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d+\s*$",
            "",
            t,
        ).strip()
        t = re.sub(r"\s+$", "", t)
        order.append(t)
        cur_title = t
        continue
    if cur_title is None:
        continue
    cur_body.append(s)

flush()

json.dump(collects, open(SCRATCH / "wikisource_trad.json", "w"), indent=1)
print("parsed", len(collects), "collect titles")
for t in order:
    print("  ", t)
