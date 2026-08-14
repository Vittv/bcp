#!/usr/bin/env python3
"""Compare every E-text traditional collect against Wikisource authoritative text."""
import json
import re

from paths import SCRATCH

wiki = json.load(open(SCRATCH / "wikisource_trad.json"))

def norm_title(t):
    t = t.replace("\u200b", " ").replace("\u00a0", " ")
    t = re.sub(r"\s+", " ", t).strip()
    t = t.replace("All Saints\u2019 Day", "All Saint's Day")
    return t

# build authoritative dict keyed by normalized title
auth = {}
for t, bodies in wiki.items():
    nt = norm_title(t)
    nt = re.sub(r"\s*(Week of the Sunday closest to|The Sunday closest to)\s*.*$", "", nt).strip()
    auth[nt] = bodies[0]  # primary collect only

# take all traditional collects from e-text across subsections
d = json.load(open(SCRATCH / "collects.json"))
trad = {}
for sub, lst in d["traditional"].items():
    for c in lst:
        trad.setdefault(c["title"], []).append((sub, c["text"]))

def norm_text(t):
    t = t.replace("=", " ").replace("\u00a0", " ").replace("\u200b", " ")
    t = re.sub(r"\s+", " ", t).strip()
    return t

missing = []
corrupt = []
ok = []
for title, entries in trad.items():
    sub, text = entries[0]
    got = norm_text(text)
    a = auth.get(title)
    if a is None:
        missing.append((title, sub))
        continue
    a = norm_text(a)
    if got == a or got.rstrip(".") == a.rstrip("."):
        ok.append(title)
        continue
    # word bigram overlap on whole text
    gw = re.findall(r"[a-z']+", got.lower())
    aw = re.findall(r"[a-z']+", a.lower())
    gb = set(" ".join(gw[i:i+2]) for i in range(len(gw)-1))
    ab = set(" ".join(aw[i:i+2]) for i in range(len(aw)-1))
    ov = len(gb & ab) / max(1, len(ab))
    corrupt.append((title, sub, ov, got, a))

print("=== NOT IN WIKISOURCE (title mismatch or truly missing):", len(missing))
for t, s in missing:
    print("   ", t, f"[{s}]")

print("\n=== DIFFERS from authoritative:", len(corrupt))
for t, s, ov, got, a in sorted(corrupt, key=lambda x: x[2]):
    print(f"\n--- {t} [{s}] overlap={ov:.2f}")
    print("   E-TEXT:", got[:200])
    print("   WIKI :", a[:200])
