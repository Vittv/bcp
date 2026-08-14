#!/usr/bin/env python3
"""Emit collects.min.json from the verified catalog.

Source: the scratch directory's collects_patched.json (E-text collects
repaired against the printed 2007 BCP via patches.json; see gen_patches.py).
Only the runtime shape is shipped: rite -> section -> [{title, text, notes}].
E-text emphasis markers (=x=) and entity placeholders (&N.) are resolved to
plain text; provenance fields (line, patched) are dropped.
"""
import json
import re

from paths import SCRATCH, VENDOR

SRC = SCRATCH / "collects_patched.json"
OUT = VENDOR / "collects.min.json"


def clean_text(t):
    t = re.sub(r"=+", "", t)          # E-text emphasis markers (=him=, =Amen.=)
    t = t.replace("&N.", "N.")        # placeholder for the saint's name
    t = re.sub(r"<page \d+>", "", t)
    t = re.sub(r"\s+", " ", t).strip()
    return t


d = json.load(open(SRC))
out = {}
count = 0
for rite in ("traditional", "contemporary"):
    out[rite] = {}
    for sec in ("church-year", "holy-days", "common-of-saints", "various-occasions"):
        out[rite][sec] = [
            {
                "title": c["title"],
                "text": clean_text(c["text"]),
                "notes": c.get("notes") or None,
            }
            for c in d[rite][sec]
        ]
        count += len(out[rite][sec])

json.dump(out, open(OUT, "w"), ensure_ascii=False, separators=(",", ":"))
print(f"wrote {OUT}: {count} collects ({len(out['traditional'])} sections x 2 rites)")
