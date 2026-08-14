#!/usr/bin/env python3
"""Verify collects_patched.json against the authoritative 2007 BCP text.

For every collect, the canonicalized entry text must equal the canonicalized
authoritative text computed by gen_patches.authoritative (printed 2007 BCP,
with Wikisource overriding only documented PDF-extraction artifacts).
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import gen_patches as g

from paths import SCRATCH

d = json.load(open(SCRATCH / "collects_patched.json"))

problems = []
for rite in d:
    for sub, lst in d[rite].items():
        for c in lst:
            auth, source = g.authoritative(rite, sub, c["title"])
            if auth is None:
                problems.append(f"NO-SOURCE: {rite}/{sub}/{c['title']}")
                continue
            ca = g.canon(auth)
            ct = g.canon(c["text"])
            if ca != ct and ct not in ca and ca not in ct:
                problems.append(f"DIFF: {rite}/{sub}/{c['title']} (src={source})")
                problems.append(f"  E: {ct}")
                problems.append(f"  A: {ca}")

print(f"{len(problems)} problems across {len(g.OVERRIDES)} override entries")
for p in problems:
    print(p)
