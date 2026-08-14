#!/usr/bin/env python3
"""Generate authoritative-text patches for the collects catalog.

Authority: the printed 2007 BCP (pdf_reference.json) is ground truth.
Wikisource is a clean human transcription used only where the PDF extraction
carries line-break artifacts (documented overrides below).

For every collect in the catalog, computes the authoritative text:
  - pdf_reference (first collect, rubric prefix stripped)
  - explicit adjudicated overrides where PDF and Wikisource disagree
If the current (E-text) collect is already fully contained in the
authoritative text (substring match), no patch is emitted -- this avoids
replacing clean E-text with rubric-prefixed source text.

Reads and writes scratch-directory artifacts; see paths.py.
"""

import json
import re
import unicodedata

from paths import SCRATCH

BASE = SCRATCH / "collects.json"
OUT = SCRATCH / "patches.json"

pdf = json.load(open(SCRATCH / "pdf_reference.json"))
wt = json.load(open(SCRATCH / "wikisource_trad.json"))
wc = json.load(open(SCRATCH / "wikisource_cont.json"))


# ---------------------------------------------------------------------------
# normalization (mirror verify_collects.py)
# ---------------------------------------------------------------------------
def norm(s):
    s = s.replace("\u2019", "'").replace("\u2018", "'")
    s = s.replace("\u201c", '"').replace("\u201d", '"')
    s = s.replace("\u2011", "-").replace("\u00ad", "")
    s = s.replace("\u200b", "")
    s = s.replace("\u00a0", " ")
    s = unicodedata.normalize("NFKC", s)
    s = re.sub(r"=+", "", s)
    s = re.sub(r"([;:,.])\1+", r"\1", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def cleanup(e):
    e = re.sub(r"<page \d+>", "", e)
    e = re.sub(r"<[^>]*>", "", e)
    e = re.sub(r"&N\.", "N.", e)
    e = re.sub(r"&NN\.", "N., or NN.", e)
    e = re.sub(r"&3em\.", "__________", e)
    e = re.sub(r"&2em\.", "________", e)
    e = re.sub(r"&4em\.", "____________", e)
    e = re.sub(r"&5em\.", "______________", e)
    e = re.sub(r"\(\(\*or\* ([^)]+)\)\)", r"(or \1)", e)
    e = re.sub(r"\(\*or\* ([^)]+)\)", r"(or \1)", e)
    e = re.sub(r"\*or\*", "or", e)
    e = re.sub(r"\*N\*", "N.", e)
    e = re.sub(r"\*N\.\*", "N.", e)
    return re.sub(r"\s+", " ", e).strip()


_RUBRIC_RE = re.compile(
    r"^("
    r"The Proper Liturgy for this day is on page \d+\.\s*"
    r"|This Proper is always used on the Sunday before Ash Wednesday\.\s*"
    r"|The Liturgy of the Easter Vigil is on page \d+\.\s*"
    r"|When a Vigil of Pentecost is observed,.*?Collect of the Day\.\s*"
    r"|This Sunday takes precedence over the three Holy Days which follow "
    r"Christmas Day\. As necessary, the observance of one, two, or all three "
    r"of them, is postponed one day\.\s*"
    r"|Three or more of the appointed Lessons are read before the Gospel, each "
    r"followed by a Psalm, Canticle, or hymn\. Holy Baptism or Confirmation "
    r"\(beginning with the Presentation of the Candidates\), or the Renewal of "
    r"Baptismal Vows, page \d+, follows the Sermon\.\s*"
    r"|Especially suitable for (?:Thursdays|Fridays|Saturdays)  \s*"
    r")"
)


def first_collect(body):
    body = _RUBRIC_RE.sub("", body)
    body = re.sub(r"^(or this|or this Collect)\s*", "", body)
    i = body.find("Amen.")
    if i != -1:
        return body[: i + 5]
    return body


def canon(s):
    return norm(first_collect(cleanup(norm(s))))


def clean_key(k):
    return re.sub(r"[\u200b\u2009\u00a0]+", " ", k).strip()


def wiki_get(w, title):
    t = clean_key(title)
    for k, v in w.items():
        ck = clean_key(k)
        if ck == t or ck.startswith(t) or t.startswith(ck):
            return v[0] if isinstance(v, list) else v
    return None


# ---------------------------------------------------------------------------
# adjudicated overrides.  PDF-first default; these flip to Wikisource where
# the pdftotext extraction carries a known artifact, or pin the printed
# reading where Wikisource differs from the printed book.
# ---------------------------------------------------------------------------
OVERRIDES = {
    # Wikisource: printed comma after "to do" lost by pdf text alignment.
    ("traditional", "various-occasions", "24. For Vocation in Daily Work"): (
        "Almighty God our heavenly Father, who declarest thy glory and showest "
        "forth thy handiwork in the heavens and in the earth: Deliver us, we "
        "beseech thee, in our several occupations from the service of self "
        "alone, that we may do the work which thou givest us to do, in truth "
        "and beauty and for the common good; for the sake of him who came "
        "among us as one that serveth, thy Son Jesus Christ our Lord, who "
        "liveth and reigneth with thee and the Holy Spirit, one God, for ever "
        "and ever. Amen."
    ),
    # Wikisource: printed "; Amen." rendered ".".
    ("contemporary", "church-year", "Proper 2"): (
        "Almighty and merciful God, in your goodness keep us, we pray, from "
        "all things that may hurt us, that we, being ready both in mind and "
        "body, may accomplish with free hearts those things which belong to "
        "your purpose; through Jesus Christ our Lord, who lives and reigns "
        "with you and the Holy Spirit, one God, now and for ever; Amen."
    ),
    # Wikisource: printed "your Holy Word" lowercased.
    ("contemporary", "holy-days", "Saint Andrew"): (
        "Almighty God, who gave such grace to your apostle Andrew that he "
        "readily obeyed the call of your Son Jesus Christ, and brought his "
        "brother with him: Give us, who are called by your Holy Word, grace "
        "to follow him without delay, and to bring those near to us into his "
        "gracious presence; who lives and reigns with you and the Holy "
        "Spirit, one God, now and for ever. Amen."
    ),
    # Wikisource: period before "Amen." dropped.
    ("contemporary", "holy-days", "The Annunciation"): (
        "Pour your grace into our hearts, O Lord, that we who have known the "
        "incarnation of your Son Jesus Christ, announced by an angel to the "
        "Virgin Mary, may by his cross and passion be brought to the glory of "
        "his resurrection; who lives and reigns with you, in the unity of the "
        "Holy Spirit, one God, now and for ever. Amen."
    ),
    # PDF artifact: comma after "the Holy Spirit" dropped at a line break.
    ("traditional", "holy-days", "The Nativity of Saint John the Baptist"): None,
    # PDF artifact: "needy-" from a line break; printed ";".
    ("contemporary", "various-occasions", "22. For Social Service"): None,
}


def authoritative(rite, sub, title):
    """Return (text, source) for the collect."""
    key = (rite, sub, title)
    if key in OVERRIDES and OVERRIDES[key]:
        return OVERRIDES[key], "override"
    p = pdf.get(f"{rite}/{sub}/{title}")
    if p is None:  # base title misspelled; look up the FIXTITLE-corrected key
        p = pdf.get(f"{rite}/{sub}/III. For all Christians in their vocation")
    if p is not None:
        text = first_collect(p)
        if key in OVERRIDES:  # pdf artifact -> use Wikisource instead
            w = wiki_get(wc if rite == "contemporary" else wt, title)
            if w is not None:
                return first_collect(w), "override-wiki"
        return text, "pdf"
    w = wiki_get(wc if rite == "contemporary" else wt, title)
    if w is not None:
        return first_collect(w), "wiki"
    return None, "none"


# ---------------------------------------------------------------------------
# reorganize_contemporary (mirror patch_collects.py)
# ---------------------------------------------------------------------------
HOLY_DAY_TITLES = [
    "Saint Andrew", "Saint Thomas", "Saint Stephen", "Saint John",
    "The Holy Innocents", "Confession of Saint Peter", "Conversion of Saint Paul",
    "The Presentation", "Saint Matthias", "Saint Joseph", "The Annunciation",
    "Saint Mark", "Saint Philip and Saint James", "The Visitation", "Saint Barnabas",
    "The Nativity of Saint John the Baptist", "Saint Peter and Saint Paul",
    "Independence Day", "Saint Mary Magdalene", "Saint James", "The Transfiguration",
    "Saint Mary the Virgin", "Saint Bartholomew", "Holy Cross Day", "Saint Matthew",
    "Saint Michael and All Angels", "Saint Luke", "Saint James of Jerusalem",
    "Saint Simon and Saint Jude", "All Saint's Day", "Thanksgiving Day",
]


def reorganize_contemporary(d):
    if "holy-days" in d["contemporary"]:
        return d
    hd, cy = [], []
    for c in d["contemporary"]["church-year"]:
        (hd if c["title"] in HOLY_DAY_TITLES else cy).append(c)
    d["contemporary"]["church-year"] = cy
    d["contemporary"]["holy-days"] = hd
    return d


# ---------------------------------------------------------------------------
# build patches
# ---------------------------------------------------------------------------
# Collects missing from the E-text base, with the validated before-title anchor.
INSERT_ANCHOR = {
    ("traditional", "church-year", "Fourth Sunday of Advent"): "The Nativity of Our Lord:  Christmas Day",
    ("traditional", "church-year", "Eighth Sunday after the Epiphany"): "Last Sunday after the Epiphany",
    ("traditional", "church-year", "Proper 4"): "Proper 5",
    ("traditional", "church-year", "Proper 14"): "Proper 15",
    ("traditional", "church-year", "Proper 25"): "Proper 26",
    ("traditional", "holy-days", "Confession of Saint Peter"): "Conversion of Saint Paul",
    ("traditional", "holy-days", "Holy Cross Day"): "Saint Matthew",
    ("traditional", "common-of-saints", "Of a Martyr"): "Of a Missionary",
    ("traditional", "common-of-saints", "Of a Monastic"): "Of a Saint",
    ("traditional", "various-occasions", "13.  For a Church Convention"): "14.  For the Unity of the Church",
    ("contemporary", "church-year", "Sixth Sunday after the Epiphany"): "Seventh Sunday after the Epiphany",
    ("contemporary", "church-year", "Fourth Sunday in Lent"): "Fifth Sunday in Lent",
    ("contemporary", "church-year", "Holy Saturday"): "Easter Day",
    ("contemporary", "church-year", "Proper 20"): "Proper 21",
    ("contemporary", "holy-days", "Saint Andrew"): "Saint Thomas",
    ("contemporary", "holy-days", "Saint James"): "The Transfiguration",
    ("contemporary", "holy-days", "Saint Simon and Saint Jude"): "All Saint's Day",
    ("contemporary", "common-of-saints", "Of a Pastor"): "Of a Theologian and Teacher",
    ("contemporary", "various-occasions", "2. Of the Holy Spirit"): "3. Of the Holy Angels",
    ("contemporary", "various-occasions", "10.  At Baptism"): "11. At Confirmation",
    ("contemporary", "various-occasions", "21. For Social Justice"): "22. For Social Service",
}


def build():

    base = reorganize_contemporary(json.load(open(BASE)))

    # ---------------------------------------------------------------------------
    # build patches
    # ---------------------------------------------------------------------------
    REPLACE = {}
    INSERT = {}
    FIXTITLE = {}
    warn = []

    for rite in base:
        for sub, lst in base[rite].items():
            for c in lst:
                title = c["title"]
                auth, source = authoritative(rite, sub, title)
                if auth is None:
                    warn.append(f"NO-SOURCE: {rite}/{sub}/{title}")
                    continue
                ca = canon(auth)
                ct = canon(c["text"])
                if ca != ct and ct not in ca:
                    REPLACE[(rite, sub, title)] = auth
                elif ct not in ca and ca not in ct:
                    pass

    for (rite, sub, title), before in INSERT_ANCHOR.items():
        auth, source = authoritative(rite, sub, title)
        if auth is None:
            warn.append(f"NO-SOURCE-INSERT: {rite}/{sub}/{title}")
            continue
        INSERT.setdefault((rite, sub), {})[title] = (before, auth)

    FIXTITLE = {
        ("traditional", "various-occasions", "III. For all Chistians in their vocation"): "III. For all Christians in their vocation",
        ("contemporary", "various-occasions", "III. For all Chistians in their vocation"): "III. For all Christians in their vocation",
    }

    # ---------------------------------------------------------------------------
    # report + audit (flag patch text that starts like a rubric)
    # ---------------------------------------------------------------------------
    print(f"REPLACE: {len(REPLACE)}")
    print(f"INSERT: {sum(len(v) for v in INSERT.values())}  ({len(INSERT)} sections)")
    print(f"FIXTITLE: {len(FIXTITLE)}")
    for w in warn:
        print("!!", w)

    rubricish = re.compile(
        r"^(The Proper Liturgy|This Proper|The Liturgy of the Easter Vigil|"
        r"When a Vigil|Three or more|Holy Baptism|The Collect|For use)"
    )
    for (rite, sub, title), text in sorted(REPLACE.items()):
        if rubricish.match(text) or "page " in text[:80]:
            print("!! rubric-leak REPLACE:", rite, sub, title, "->", text[:90])

    json.dump(
        {
            "REPLACE": {f"{r}|{s}|{t}": v for (r, s, t), v in sorted(REPLACE.items())},
            "INSERT": {
                f"{r}|{s}": {t: {"before": b, "text": v} for t, (b, v) in items.items()}
                for (r, s), items in sorted(INSERT.items())
            },
            "FIXTITLE": {f"{r}|{s}|{t}": v for (r, s, t), v in sorted(FIXTITLE.items())},
        },
        open(OUT, "w"),
        indent=1,
        ensure_ascii=False,
    )
    print(f"wrote {OUT}")



if __name__ == "__main__":
    build()
