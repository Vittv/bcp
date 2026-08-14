#!/usr/bin/env python3
"""Extract the seven Daily Office forms from the public-domain BCP E-text.

Reads bcpoffce.txt from the sources directory and emits the reconstructed
offices: offices.json (intermediate, in the scratch directory) and
offices.min.json (shipped artifact, in the repo vendor directory).

Line spans are stable in the BCP10.TXT / bcp10.txt E-text office file
(BCPOFFCE): each office runs from a <Title> line to just before the next.
See PROVENANCE.md for the corrections applied and the fidelity notes.
"""

import json
import re

from paths import SCRATCH, SOURCES, VENDOR

SOURCE = SOURCES / "bcpoffce.txt"

# office spans: (id, name, rite, start_line_1based, end_line_exclusive)
OFFICES = [
    ("morning-rite-one", "Daily Morning Prayer", "One", 1706, 2752),
    ("evening-rite-one", "Daily Evening Prayer", "One", 2752, 3257),
    ("morning-rite-two", "Daily Morning Prayer", "Two", 3257, 4548),
    ("noonday", "An Order of Service for Noonday", None, 4548, 4782),
    ("owe", "An Order of Worship for the Evening", None, 4841, 5074),
    ("evening-rite-two", "Daily Evening Prayer", "Two", 5074, 5605),
    ("compline", "An Order for Compline", None, 5605, 5992),
]

PAGE = re.compile(r"^<page \d+>$")
PARALLEL = "<parallel column>"
SPEAKER_MAP = {
    "Officiant": "officiant",
    "People": "people",
    "Answer": "people",
    "Officiant and People": "all",
    "Officiant and People together, all standing": "all",
    "Officiant and People together, all kneeling": "all",
    "The People respond": "people",
    "The People may respond": "people",
}
OPTION_TEXTS = {"or this", "or the following", "or this one"}
SECTION_KEYS = {
    "Confession of Sin": "confession",
    "The Invitatory and Psalter": "invitatory",
    "The Psalm or Psalms Appointed": "psalms",
    "The Lessons": "lessons",
    "The Apostles' Creed": "creed",
    "The Apostle's Creed": "creed",
    "The Prayers": "prayers",
    "Suffrages A": "suffrages-a",
    "Suffrages B": "suffrages-b",
}
# PDF-verified E-text corrections. Ordered; longer/contained patterns first.
FIXES = [
    ("[&mdash. and]", "[______ and]"),
    ("[&3m. and ]", "[______ and]"),
    ("&mdash.", "\u2014"),
    ("upon your bead.", "upon your bed."),
    ("Phillipians 1:2", "Philippians 1:2"),
    ("hve mercy upon us.", "have mercy upon us."),
    ("sustain us with your Holy Spirit.", "sustain us with thy Holy Spirit."),
    ("in you sight, O Lord", "in your sight, O Lord"),
    ("resurrection of you Son", "resurrection of your Son"),
    ("rested from all you works", "rested from all your works"),
    ("for all you creatures", "for all your creatures"),
    (
        "offer before your for all members of you holy Church",
        "offer before you for all members of your holy Church",
    ),
    ("mean and women", "men and women"),
    ("Pslam 139:10,11", "Psalm 139:10,11"),
    ("Almighty god", "Almighty God"),
    ("Let my payer", "Let my prayer"),
    ("boundries", "boundaries"),
    ("Pleides", "Pleiades"),
    ("tresspasses", "trespasses"),
    ("your statues", "your statutes"),
]
RUBRIC_SPLIT = re.compile(r"\*(.*?)\*")
CANTICLES = json.load(open(VENDOR / "canticles.min.json", encoding="utf-8"))


def cleanup(text):
    text = text.replace("\u00a0", " ")
    for a, b in FIXES:
        text = text.replace(a, b)
    text = re.sub(r"\s+", " ", text).strip()
    text = re.sub(r"\s+([,.;:!?])", r"\1", text)
    text = re.sub(r"(\d):\s+", r"\1:", text)
    return text


def join_paragraph(lines):
    parts = []
    for ln in lines:
        s = ln.strip()
        s = re.sub(r"^\d+\s+", "", s)
        if s.startswith("/"):
            parts.append(s[1:].strip())
            continue
        if s.endswith("*"):
            s = s[:-1].rstrip()
        parts.append(s)
    return " ".join(p for p in parts if p)


def clean_office_lines(lines):
    out = []
    skip = False
    for ln in lines:
        s = ln.strip()
        if PAGE.match(s):
            continue
        if s == PARALLEL:
            skip = True
            continue
        if skip:
            if s.startswith("*") or s.startswith("<"):
                skip = False
            else:
                continue
        out.append(ln.rstrip())
    return out


def paragraphs(lines):
    paras = []
    cur = []
    for ln in lines:
        if ln.strip() == "":
            if cur:
                paras.append(cur)
                cur = []
        else:
            cur.append(ln.strip())
    if cur:
        paras.append(cur)
    return paras


def normalize_canticle_heading(item):
    m = re.match(r"^(?:Canticle )?(\d+)", item["text"])
    if not m:
        return
    cat = CANTICLES.get(m.group(1))
    if not cat:
        return
    parts = [m.group(1)]
    if cat.get("title"):
        parts.append(cat["title"])
    if cat.get("latin"):
        parts.append(cat["latin"])
    item["text"] = " ".join(parts)


def parse_heading(par):
    text = " ".join(par)
    m = re.match(r"^<([^>]+)>(.*)$", text, re.S)
    title = m.group(1).strip()
    rest = m.group(2).strip()
    tokens = [t.strip() for t in re.findall(r"=(.*?)=", rest, flags=re.S)]
    plain = re.sub(r"=(.*?)=", "", rest, flags=re.S).strip()
    item = {"kind": "heading", "text": title}
    if tokens:
        latin = [t for t in tokens if not re.search(r"\d", t)]
        scripture = [t for t in tokens if re.search(r"\d", t)]
        if latin:
            item["text"] = cleanup(title + " " + " ".join(latin))
        if scripture:
            item["citation"] = cleanup(scripture[-1])
    items = [item]
    if plain:
        if plain.startswith("*") and plain.endswith("*"):
            items.append({"kind": "rubric", "text": cleanup(plain[1:-1])})
        elif plain.startswith("*"):
            items.append({"kind": "rubric", "text": cleanup(plain[1:])})
        else:
            items[0]["text"] = cleanup(title + " " + plain)
    normalize_canticle_heading(item)
    return items


def parse_standalone_eq(par):
    text = " ".join(par)
    content = text.strip()
    if content.startswith("=") and content.endswith("="):
        content = content[1:-1].strip()
    if re.search(r"\d", content):
        return [{"kind": "cite", "citation": cleanup(content)}]
    if content.endswith(".") or content.endswith("!"):
        return [{"kind": "text", "text": cleanup(content), "speaker": "people"}]
    return [{"kind": "season", "text": cleanup(content)}]


def parse_versicles(par):
    items = []
    for ln in par:
        s = ln.strip()
        if s.startswith("&V."):
            items.append(
                {"kind": "text", "text": cleanup(s[3:].strip()), "speaker": "officiant"}
            )
        elif s.startswith("&R."):
            items.append(
                {"kind": "text", "text": cleanup(s[3:].strip()), "speaker": "people"}
            )
        else:
            items.append({"kind": "text", "text": cleanup(s)})
    return items


def make_text(joined, speaker):
    segments = re.split(r"=(.*?)=", joined, flags=re.S)
    items = []
    buf = ""
    for i, seg in enumerate(segments):
        if i % 2 == 0:
            buf += seg
            continue
        seg = seg.strip()
        if not seg:
            continue
        plain = cleanup(buf)
        buf = ""
        if plain:
            items.append(
                {"kind": "text", "text": plain, "speaker": speaker if not items else None}
            )
        if re.search(r"\d", seg):
            if items and "citation" not in items[-1]:
                items[-1]["citation"] = cleanup(seg)
            else:
                items.append({"kind": "text", "text": "", "speaker": "people", "citation": cleanup(seg)})
        else:
            items.append({"kind": "text", "text": cleanup(seg), "speaker": "people"})
    plain = cleanup(buf)
    if plain:
        items.append(
            {"kind": "text", "text": plain, "speaker": speaker if not items else None}
        )
    return items


def parse_star_paragraph(par, state):
    joined = " ".join(par)
    parts = RUBRIC_SPLIT.split(joined)
    items = []
    speaker = state["pending"]
    for i, seg in enumerate(parts):
        if i % 2 == 0:
            seg = seg.strip()
            if seg:
                items.extend(make_text(seg, speaker))
                speaker = None
        else:
            label = seg.strip()
            if label in OPTION_TEXTS:
                items.append({"kind": "option", "text": label})
                speaker = None
            elif label in SPEAKER_MAP:
                speaker = SPEAKER_MAP[label]
            else:
                items.append({"kind": "rubric", "text": cleanup(label)})
                speaker = None
    state["pending"] = speaker
    return items


def parse_plain_text(par, state):
    speaker = state["pending"]
    state["pending"] = None
    joined = join_paragraph(par)
    if cleanup(joined) == "Thanks be to God. Alleluia, alleluia.":
        return [{"kind": "text", "text": cleanup(joined), "speaker": "people"}]
    return make_text(joined, speaker)


def emit_paragraph(par, state):
    first = par[0]
    if first.startswith("<"):
        return parse_heading(par)
    if first.startswith("="):
        return parse_standalone_eq(par)
    if re.match(r"^&[VR]\.", first):
        return parse_versicles(par)
    if first.startswith("*"):
        return parse_star_paragraph(par, state)
    return parse_plain_text(par, state)


SECTION_HEADING_TEXTS = {
    "Confession of Sin",
    "The Invitatory and Psalter",
    "The Psalm or Psalms Appointed",
    "The Lessons",
    "The Apostles' Creed",
    "The Apostle's Creed",
    "The Prayers",
    "Suffrages A",
    "Suffrages B",
    "Selection from the Psalter.",
    "Bible Reading.",
    "Canticle.",
    "Prayers.",
    "Blessing or Dismissal,",
}


def is_section_break(it):
    return it["kind"] == "heading" and it["text"] in SECTION_HEADING_TEXTS


def slugify(t):
    t = re.sub(r"[^a-z0-9]+", "-", t.lower()).strip("-")
    return t


def section_key(text):
    return SECTION_KEYS.get(text) or slugify(text)


def star_norm(par):
    joined = " ".join(par)
    parts = RUBRIC_SPLIT.split(joined)
    out = []
    for i, seg in enumerate(parts):
        seg = seg.strip()
        if i % 2 == 0:
            if seg:
                out.append(seg)
        else:
            if seg in SPEAKER_MAP:
                continue
            if seg:
                out.append(seg)
    return cleanup(" ".join(out))


def source_norm(par):
    first = par[0]
    if first.startswith("*"):
        return star_norm(par)
    text = join_paragraph(par)
    text = re.sub(r"^&[VR]\.\s*", "", text, flags=re.M)
    text = text.replace("=", "")
    return cleanup(text)


def items_norm(items):
    parts = []
    for it in items:
        if "text" not in it:
            continue
        parts.append(it["text"])
        if it.get("citation"):
            parts.append(it["citation"])
    return cleanup(" ".join(p for p in parts if p))


def is_lp_doxology(par):
    joined = cleanup(join_paragraph(par))
    return joined == "For thine is the kingdom, and the power, and the glory, for ever and ever. Amen."


def build_office(oid, name, rite, paras):
    state = {"pending": None}
    sections = []
    current = {"key": "opening", "items": []}
    last_item = None
    problems = []
    title = paras[0]
    assert title[0].startswith("<"), f"{oid}: first paragraph is not a title: {title}"
    for par in paras[1:]:
        if oid in ("noonday", "compline") and is_lp_doxology(par):
            continue
        items = emit_paragraph(par, state)
        kind = items[0]["kind"] if items else None
        if kind in ("heading", "cite"):
            pass
        else:
            norm = items_norm(items)
            src = source_norm(par)
            if norm != src:
                problems.append((oid, kind or "src", src, norm, par))
        for it in items:
            if it["kind"] == "cite":
                if last_item is not None and "citation" not in last_item:
                    last_item["citation"] = it["citation"]
                else:
                    current["items"].append({"kind": "text", "text": it["citation"]})
                continue
            if it["kind"] == "heading" and is_section_break(it):
                sections.append(
                    {
                        "key": current["key"],
                        "heading": current.get("heading"),
                        "items": current["items"],
                    }
                )
                current = {
                    "key": section_key(it["text"]),
                    "heading": it["text"],
                    "items": [],
                }
                last_item = None
                continue
            current["items"].append(it)
            last_item = it
    sections.append(
        {"key": current["key"], "heading": current.get("heading"), "items": current["items"]}
    )
    office = {"id": oid, "name": name, "rite": rite, "sections": sections}
    return office, problems


def strip_nulls(o):
    if isinstance(o, dict):
        return {k: strip_nulls(v) for k, v in o.items() if v is not None}
    if isinstance(o, list):
        return [strip_nulls(v) for v in o]
    return o


def main():
    lines = open(SOURCE, encoding="utf-8").read().split("\n")
    offices = {}
    all_problems = []
    for oid, name, rite, start, end in OFFICES:
        chunk = lines[start - 1 : end - 1]
        clean = clean_office_lines(chunk)
        paras = paragraphs(clean)
        office, problems = build_office(oid, name, rite, paras)
        offices[oid] = office
        all_problems.extend(problems)

    print("=== reconstruction problems ===")
    for oid, tag, src, norm, par in all_problems:
        print(f"[{oid}] {tag}")
        print("  src :", src[:160])
        print("  norm:", norm[:160])
        print("  par :", par)
    print("total problems:", len(all_problems))

    for oid, off in offices.items():
        n_items = sum(len(s["items"]) for s in off["sections"])
        n_sections = len(off["sections"])
        keys = [s["key"] for s in off["sections"]]
        print(f"{oid}: sections={n_sections} items={n_items} keys={keys}")

    intermediate = SCRATCH / "offices.json"
    with open(intermediate, "w", encoding="utf-8") as f:
        json.dump(offices, f, ensure_ascii=False, indent=1)
    print(f"wrote {intermediate}")

    shipped = VENDOR / "offices.min.json"
    with open(shipped, "w", encoding="utf-8") as f:
        json.dump(strip_nulls(offices), f, ensure_ascii=False, separators=(",", ":"))
    print(f"wrote {shipped}")


if __name__ == "__main__":
    main()
