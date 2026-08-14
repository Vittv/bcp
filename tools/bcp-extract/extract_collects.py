#!/usr/bin/env python3
"""Extract the collects from the public-domain BCP E-text collects file.

Reads bcpcolct.txt from the sources directory and emits collects.json (the
unpatched catalog) into the scratch directory.
"""

import json
import re

from paths import SCRATCH, SOURCES

HEADER = re.compile(r"^<(.+?)>\s*(?:[=*].*?[=*])?\s*$")
PAGE = re.compile(r"^<page \d+>$", re.IGNORECASE)
AMEN = re.compile(r"=Amen\.=\s*$")
NOTE = re.compile(r"^\*(.*?)\*\s*$")

lines = open(SOURCES / "bcpcolct.txt").read().split("\n")

# markers that switch rite / subsection
RITE = {
    "<Collects:  Traditional>": "traditional",
    "<Collects:  Contemporary>": "contemporary",
}
SUBSECTION = {
    "<Holy Days>": "holy-days",
    "<The Common of Saints>": "common-of-saints",
    "<Various Occasions>": "various-occasions",
}

collects = []
cur = None
rite = None
subsection = "church-year"
in_note = False


def flush():
    global cur, in_note
    in_note = False
    if cur is not None:
        if cur.get("text"):
            cur["text"] = re.sub(r"\s+", " ", " ".join(cur["text"])).strip()
            if cur["text"].endswith("Amen."):
                cur["text"] = cur["text"][:-5].rstrip()
        else:
            cur["text"] = ""
        collects.append(cur)
    cur = None


# headers that act as section containers rather than collects
CONTAINERS = {
    "<The Season after Pentecost>",
    "<15.  For the Ministry (Ember Days)>",
    "<19. For Rogation Days>",
}

for i, line in enumerate(lines, 1):
    s = line.strip()
    if not s:
        continue
    if PAGE.match(line):
        continue
    if line in RITE:
        flush()
        rite = RITE[line]
        subsection = "church-year"
        continue
    if line in SUBSECTION:
        flush()
        subsection = SUBSECTION[line]
        continue
    if line in CONTAINERS:
        flush()
        continue
    if line.startswith("<The Collects") or line.startswith("-------------------"):
        continue
    m = HEADER.match(line)
    if m and "<" not in line[1:]:
        flush()
        cur = {
            "title": m.group(1).strip(),
            "rite": rite,
            "subsection": subsection,
            "text": [],
            "notes": [],
            "line": i,
        }
        continue
    if cur is None:
        continue
    if AMEN.search(s):
        cur["text"].append(s)
        flush()
        continue
    if in_note or s.startswith("*"):
        cur["notes"].append(s.strip("*").strip())
        in_note = not s.rstrip().endswith("*") and not s.rstrip().endswith("*$")
        continue
    cur["text"].append(s)

flush()

# structure output
out = {}
for c in collects:
    r = out.setdefault(c["rite"], {})
    sub = r.setdefault(c["subsection"], [])
    sub.append(
        {
            "title": c["title"],
            "text": c["text"],
            "notes": c["notes"] or None,
            "line": c["line"],
        }
    )

for rite in out:
    print("==", rite)
    for sub, lst in out[rite].items():
        print(f"   {sub}: {len(lst)} collects")
    # check for anomalies
    for sub, lst in out[rite].items():
        for c in lst:
            if not c["text"]:
                print(f"   !! {sub} L{c['line']} {c['title']}: EMPTY")
            elif len(c["text"]) < 80:
                print(f"   ?? {sub} L{c['line']} {c['title']}: SHORT ({c['text']})")

json.dump(out, open(SCRATCH / "collects.json", "w"), indent=1)
