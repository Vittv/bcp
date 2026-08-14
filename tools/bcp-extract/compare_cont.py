#!/usr/bin/env python3
"""Compare every E-text contemporary collect against Wikisource authoritative text."""
import json
import re

from paths import SCRATCH

wiki = json.load(open(SCRATCH / "wikisource_cont.json"))

def norm_title(t):
    t = t.replace("\u200b", " ").replace("\u00a0", " ")
    t = re.sub(r"\s+", " ", t).strip()
    return t

auth = {}
for t, bodies in wiki.items():
    nt = norm_title(t)
    nt = re.sub(r"\s*(Week of the Sunday closest to|The Sunday closest to)\s*.*$", "", nt).strip()
    if nt.startswith("or"):
        continue
    auth[nt] = bodies[0]

d = json.load(open(SCRATCH / "collects.json"))
cont = {}
for sub, lst in d["contemporary"].items():
    for c in lst:
        cont.setdefault(c["title"], []).append((sub, c["text"]))

def norm_text(t):
    t = t.replace("=", " ").replace("\u00a0", " ").replace("\u200b", " ")
    t = re.sub(r"\s+", " ", t).strip()
    return t

missing = []
corrupt = []
ok = []
for title, entries in cont.items():
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
    gw = re.findall(r"[a-z']+", got.lower())
    aw = re.findall(r"[a-z']+", a.lower())
    gb = set(" ".join(gw[i:i+2]) for i in range(len(gw)-1))
    ab = set(" ".join(aw[i:i+2]) for i in range(len(aw)-1))
    ov = len(gb & ab) / max(1, len(ab))
    corrupt.append((title, sub, ov, got, a))

print("=== NOT IN WIKISOURCE:", len(missing))
for t, s in missing:
    print("   ", t, f"[{s}]")

print("\n=== DIFFERS from authoritative:", len(corrupt))
for t, s, ov, got, a in sorted(corrupt, key=lambda x: x[2]):
    flag = "" if ov >= 0.9 else "  <== CHECK"
    print(f"\n--- {t} [{s}] overlap={ov:.2f}{flag}")
    print("   E-TEXT:", got[:160])
    print("   WIKI :", a[:160])
