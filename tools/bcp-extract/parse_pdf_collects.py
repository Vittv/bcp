#!/usr/bin/env python3
"""Extract the printed collects from the pdftotext output of the 2007 BCP.

Reads bcp2007.txt from the sources directory and emits pdf_reference.json
into the scratch directory: {rite/section/title: body} for every collect.
"""

import json
import re

from paths import SCRATCH, SOURCES

text = open(SOURCES / "bcp2007.txt").read()
lines = text.split("\n")

d = json.load(open(SCRATCH / "collects_patched.json"))

def normalize_title(t):
    t = t.replace("\u00a0", " ").replace("\u2019", "'")
    t = re.sub(r"\s+", " ", t).strip()
    return t

trad_start = trad_end = cont_start = None
for i, l in enumerate(lines):
    if re.match(r"^\s*158 Collects: Traditional", l):
        trad_start = i
    if re.match(r"^\s*210 Collects: Traditional", l):
        trad_end = i
    if re.match(r"^\s*Collects: Contemporary\s*$", l) and cont_start is None:
        cont_start = i

def find_title_line(title, start, end):
    pat = re.compile(r"^\s*" + re.escape(title) + r"(?:\s|$)")
    for i in range(start, end):
        l = lines[i].replace("\u2019", "'")
        if pat.match(l):
            return i
    return None

def extract_body(idx, end):
    body = []
    j = idx + 1
    while j < len(lines) and j < end:
        l = lines[j]
        if re.match(r"^\s*Preface of", l) or re.match(r"^\s*or this", l) or re.match(r"^\s*or the following", l):
            break
        if re.match(r"^\s*Collects: (Traditional|Contemporary)", l):
            break
        if re.match(r"^\s*\d{3} Collects", l) or re.search(r"0001-1008 txt|new PDF Supplied PU", l):
            j += 1
            continue
        body.append(l.strip())
        j += 1
    joined = " ".join(body).strip()
    joined = re.sub(
        r"^(The Proper Liturgy for this day is on page \d+\.\s*"
        r"|This Proper is always used on the Sunday before Ash Wednesday\.\s*"
        r"|The Liturgy of the Easter Vigil is on page \d+\.\s*"
        r"|When a Vigil of Pentecost is observed,.*?Collect of the Day\.\s*)",
        "",
        joined,
    )
    m = joined.find("Amen.")
    if m != -1:
        joined = joined[: m + 5]
    return joined

out = {}
missed = []
for rite in ("traditional", "contemporary"):
    if rite == "traditional":
        start, end = trad_start, trad_end
    else:
        start, end = cont_start, len(lines)
    for sub in ("church-year", "holy-days", "common-of-saints", "various-occasions"):
        for c in d[rite][sub]:
            t = normalize_title(c["title"])
            candidates = [
                t,
                t.replace("All Saint's Day", "All Saints' Day"),
                t.replace("II. For Commerce and Industry", "II. For commerce and industry"),
                t.replace("7. For all Baptized Christians", "7. For All Baptized Christians"),
            ]
            idx = None
            for cand in candidates:
                idx = find_title_line(cand, start, end)
                if idx is not None:
                    break
            if idx is None:
                missed.append((rite, sub, c["title"]))
                continue
            out[f"{rite}/{sub}/{c['title']}"] = extract_body(idx, end)

json.dump(out, open(SCRATCH / "pdf_reference.json", "w"), indent=1)
print("matched:", len(out), "missed:", len(missed))
for m in missed:
    print("MISS:", m)
