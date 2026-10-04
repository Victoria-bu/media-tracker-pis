#!/usr/bin/env python3
"""Render refs.bib into a ready-made `thebibliography` (references.tex).

Styles: ieee (numeric, citation order), dstu (DSTU 8302:2015 simplified form,
numeric, citation order or alphabetical), apa (APA 7, author-year via natbib,
alphabetical). Descriptor language follows the document language for ieee
and apa, and the source language for dstu.

Pre-rendering removes the biber/bibtex step: the document compiles with two
xelatex runs, and Cyrillic names are handled by Python rather than BibTeX.

Usage:
  python3 bibfmt.py --bib refs.bib --tex main.tex --style ieee --lang uk --out references.tex
Prints a JSON report (cited, missing keys, uncited entries, incomplete entries).
"""
import argparse
import datetime as _dt
import json
import re
import sys
from pathlib import Path

UK_ALPHABET = "абвгґдеєжзиіїйклмнопрстуфхцчшщьюя"
CYR_RE = re.compile(r"[\u0400-\u04FF]")

WORDS = {
    "ieee": {
        "en": {"etal": "et al.", "and": "and", "vol": "vol.", "no": "no.", "pp": "pp.", "p": "p.",
               "in": "in", "ed": "ed.", "eds": "Eds.", "ed1": "Ed.", "techrep": "Tech. Rep.",
               "phd": "Ph.D. dissertation", "ms": "M.S. thesis", "online": "[Online]. Available:",
               "accessed": "Accessed:"},
        "uk": {"etal": "та ін.", "and": "та", "vol": "т.", "no": "№", "pp": "с.", "p": "с.",
               "in": "у", "ed": "вид.", "eds": "ред.", "ed1": "ред.", "techrep": "тех. звіт",
               "phd": "дис. д-ра філос.", "ms": "магістер. робота", "online": "[Онлайн]. Доступно:",
               "accessed": "Дата звернення:"},
    },
    "dstu": {
        "en": {"etal": "et al.", "vol": "Vol.", "no": "No.", "p": "P.", "pages_total": "p.",
               "techrep": "technical report", "phd": "PhD thesis", "ms": "Master's thesis", "ed": "ed."},
        "uk": {"etal": "та ін.", "vol": "Т.", "no": "№", "p": "С.", "pages_total": "с.",
               "techrep": "технічний звіт", "phd": "дис. … д-ра філос.", "ms": "кваліфікаційна робота магістра", "ed": "вид."},
        "access": {"uk": "дата звернення", "en": "date of access"},
    },
    "apa": {
        "en": {"etal": "et al.", "amp": "\\&", "in": "In", "pp": "pp.", "nd": "n.d.", "ed": "ed.",
               "phd": "Doctoral dissertation", "ms": "Master's thesis", "report": "Report No."},
        "uk": {"etal": "та ін.", "amp": "та", "in": "У", "pp": "с.", "nd": "б. р.", "ed": "вид.",
               "phd": "Дисертація доктора філософії", "ms": "Кваліфікаційна робота магістра", "report": "Звіт №"},
    },
}
MONTHS = {
    "en": ["Jan.", "Feb.", "Mar.", "Apr.", "May", "Jun.", "Jul.", "Aug.", "Sep.", "Oct.", "Nov.", "Dec."],
    "uk": ["січ.", "лют.", "бер.", "квіт.", "трав.", "черв.", "лип.", "серп.", "вер.", "жовт.", "лист.", "груд."],
}
MONTH_KEYS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]

REQUIRED = {
    "article": [["author"], ["title"], ["journal"], ["year"]],
    "inproceedings": [["author"], ["title"], ["booktitle"], ["year"]],
    "conference": [["author"], ["title"], ["booktitle"], ["year"]],
    "incollection": [["author"], ["title"], ["booktitle"], ["year"]],
    "book": [["author", "editor"], ["title"], ["publisher"], ["year"]],
    "techreport": [["author", "institution"], ["title"], ["institution"], ["year"]],
    "phdthesis": [["author"], ["title"], ["school"], ["year"]],
    "mastersthesis": [["author"], ["title"], ["school"], ["year"]],
    "manual": [["title"], ["author", "organization"], ["year"]],
    "misc": [["title"], ["url", "howpublished", "publisher", "eprint"], ["year", "urldate"]],
    "online": [["title"], ["url"], ["year", "urldate"]],
    "electronic": [["title"], ["url"], ["year", "urldate"]],
}


# ----------------------------------------------------------------- parsing

def _read_braced(s, i):
    depth, j = 0, i
    while j < len(s):
        c = s[j]
        if c == "\\":
            j += 2
            continue
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                return s[i + 1:j], j + 1
        j += 1
    raise ValueError("unbalanced braces in .bib")


def _read_quoted(s, i):
    depth, j = 0, i + 1
    while j < len(s):
        c = s[j]
        if c == "\\":
            j += 2
            continue
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
        elif c == '"' and depth == 0:
            return s[i + 1:j], j + 1
        j += 1
    raise ValueError("unterminated quoted value in .bib")


def parse_bib(text):
    entries, strings = [], {}
    pos = 0
    at = re.compile(r"@\s*(\w+)\s*([{(])")
    while True:
        m = at.search(text, pos)
        if not m:
            break
        etype = m.group(1).lower()
        close = "}" if m.group(2) == "{" else ")"
        start = m.end() - 1
        if etype in ("comment", "preamble"):
            if m.group(2) == "{":
                _, pos = _read_braced(text, start)
            else:
                pos = text.index(")", start) + 1
            continue
        i = m.end()
        if etype == "string":
            body, pos = _read_braced(text, start)
            sm = re.match(r"\s*(\w+)\s*=\s*[{\"](.*)[}\"]\s*$", body, re.S)
            if sm:
                strings[sm.group(1).lower()] = sm.group(2)
            continue
        comma = text.index(",", i)
        key = text[i:comma].strip()
        i = comma + 1
        fields = {}
        while True:
            while i < len(text) and text[i] in " \t\r\n,":
                i += 1
            if i >= len(text) or text[i] == close:
                i += 1
                break
            fm = re.compile(r"([A-Za-z][\w\-:.]*)\s*=\s*").match(text, i)
            if not fm:
                raise ValueError(f"cannot parse field in entry {key} near: {text[i:i+40]!r}")
            name = fm.group(1).lower()
            i = fm.end()
            parts = []
            while True:
                while text[i] in " \t\r\n":
                    i += 1
                if text[i] == "{":
                    val, i = _read_braced(text, i)
                elif text[i] == '"':
                    val, i = _read_quoted(text, i)
                else:
                    vm = re.compile(r"[^,#}\)\s]+").match(text, i)
                    val = vm.group(0)
                    i = vm.end()
                    val = strings.get(val.lower(), val)
                parts.append(val)
                while i < len(text) and text[i] in " \t\r\n":
                    i += 1
                if i < len(text) and text[i] == "#":
                    i += 1
                    continue
                break
            fields[name] = re.sub(r"\s+", " ", "".join(parts)).strip()
        entries.append({"type": etype, "key": key, "fields": fields})
        pos = i
    return entries


# ----------------------------------------------------------------- names

def split_and(s):
    out, depth, cur, i = [], 0, "", 0
    while i < len(s):
        c = s[i]
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
        if depth == 0 and re.match(r"\s+and\s+", s[i:]) and (i == 0 or s[i] in " \t\n"):
            m = re.match(r"\s+and\s+", s[i:])
            out.append(cur.strip())
            cur = ""
            i += m.end()
            continue
        cur += c
        i += 1
    if cur.strip():
        out.append(cur.strip())
    return out


def split_ws(s):
    toks, depth, cur = [], 0, ""
    for c in s:
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
        if c.isspace() and depth == 0:
            if cur:
                toks.append(cur)
            cur = ""
        else:
            cur += c
    if cur:
        toks.append(cur)
    return toks


def parse_name(raw):
    raw = raw.strip()
    if raw.lower() == "others":
        return {"others": True}
    if raw.startswith("{") and raw.endswith("}") and _read_braced(raw, 0)[1] == len(raw):
        return {"corporate": raw[1:-1].strip()}
    if "," in raw:
        parts = [p.strip() for p in raw.split(",")]
        last = parts[0]
        first = parts[-1] if len(parts) > 1 else ""
        return {"last": last, "first": first}
    toks = split_ws(raw)
    if len(toks) == 1:
        return {"last": toks[0], "first": ""}
    # von particles: lowercase tokens directly before the last name
    i = len(toks) - 1
    while i > 1 and toks[i - 1][:1].islower():
        i -= 1
    return {"last": " ".join(toks[i:]), "first": " ".join(toks[:i])}


def initial(token):
    token = token.strip()
    if not token:
        return ""
    if token.startswith("{"):
        grp, end = _read_braced(token, 0)
        return "{" + grp + "}."
    if token.startswith("\\"):
        m = re.match(r"\\[A-Za-z]+\s*\{?(\w)\}?|\\.\{?(\w)\}?", token)
        return (token[:m.end()] if m else token[:2]) + "."
    if token.endswith(".") and len(token) <= 3:
        return token
    return token[0] + "."


def initials(first):
    out = []
    for tok in split_ws(first):
        if "-" in tok and not tok.startswith("{"):
            out.append("-".join(initial(p) for p in tok.split("-") if p))
        else:
            out.append(initial(tok))
    return " ".join(x for x in out if x)


def strip_braces(s):
    return s.replace("{", "").replace("}", "") if "\\" not in s else s


def names_list(field):
    return [parse_name(n) for n in split_and(field or "")] if field else []


# ----------------------------------------------------------------- helpers

def src_lang(e):
    lid = e["fields"].get("langid", e["fields"].get("language", "")).lower()
    if lid in ("ukrainian", "uk", "ukr", "russian", "ru"):
        return "uk"
    if lid in ("english", "en", "american", "british"):
        return "en"
    return "uk" if CYR_RE.search(e["fields"].get("title", "") + e["fields"].get("author", "")) else "en"


def pages_fmt(p):
    return re.sub(r"(?<=\w)\s*[-–—]{1,3}\s*(?=\w)", "--", p or "")


def esc_text(s):
    s = re.sub(r"(?<!\\)&", r"\\&", s or "")
    s = re.sub(r"(?<!\\)%", r"\\%", s)
    s = re.sub(r"(?<!\\)#", r"\\#", s)
    return s


def url_tex(u):
    return r"\url{" + u.replace("%", r"\%").replace("#", r"\#") + "}"


def doi_clean(d):
    return re.sub(r"^(https?://(dx\.)?doi\.org/|doi:\s*)", "", d or "", flags=re.I)


def month_str(f, lang):
    m = (f.get("month") or "").strip().lower()[:3]
    if m in MONTH_KEYS:
        return MONTHS[lang][MONTH_KEYS.index(m)]
    if m.isdigit() and 1 <= int(m) <= 12:
        return MONTHS[lang][int(m) - 1]
    return ""


def date_dmy(s):
    try:
        d = _dt.date.fromisoformat(s.strip()[:10])
        return d.strftime("%d.%m.%Y")
    except Exception:
        return s


def edition(ed, lang):
    ed = (ed or "").strip()
    if not ed:
        return ""
    if ed.isdigit():
        n = int(ed)
        if lang == "uk":
            return f"{n}-е вид."
        suf = "th" if 10 <= n % 100 <= 20 else {1: "st", 2: "nd", 3: "rd"}.get(n % 10, "th")
        return f"{n}{suf} ed."
    return ed if ed.endswith(".") else ed + (" вид." if lang == "uk" else " ed.")


def end_dot(s):
    s = s.rstrip()
    return s if s.endswith((".", "?", "!")) else s + "."


def join_nonempty(parts, sep=", "):
    return sep.join(p for p in parts if p)


def is_arxiv(e):
    f = e["fields"]
    return (f.get("archiveprefix", "").lower() == "arxiv" or f.get("eprinttype", "").lower() == "arxiv"
            or "arxiv" in f.get("journal", "").lower()) and (f.get("eprint") or re.search(r"\d{4}\.\d{4,5}", f.get("journal", "")))


def arxiv_id(e):
    f = e["fields"]
    if f.get("eprint"):
        return f["eprint"]
    m = re.search(r"\d{4}\.\d{4,5}(v\d+)?", f.get("journal", ""))
    return m.group(0) if m else ""


# ----------------------------------------------------------------- IEEE

def ieee_names(ns, w):
    ns = [n for n in ns]
    others = any(n.get("others") for n in ns)
    ns = [n for n in ns if not n.get("others")]

    def one(n):
        if "corporate" in n:
            return n["corporate"]
        ini = initials(n["first"]).replace(" ", "~")
        return (ini + "~" + n["last"]) if ini else n["last"]
    if not ns:
        return ""
    if len(ns) > 6:
        return one(ns[0]) + " " + w["etal"]
    if others:
        return ", ".join(one(n) for n in ns) + " " + w["etal"]
    if len(ns) == 1:
        return one(ns[0])
    if len(ns) == 2:
        return f"{one(ns[0])} {w['and']} {one(ns[1])}"
    comma = "," if w["and"] == "and" else ""
    return ", ".join(one(n) for n in ns[:-1]) + f"{comma} {w['and']} " + one(ns[-1])


def ieee_title(t, lang, last=False):
    t = esc_text(t)
    if lang == "en" and not t.endswith(("?", "!")):
        return f"“{t},”"
    return f"“{t}”" + ("" if t.endswith(("?", "!")) else ",")


def fmt_ieee(e, lang):
    w = WORDS["ieee"][lang]
    f = e["fields"]
    t = e["type"]
    au = ieee_names(names_list(f.get("author")), w)
    if not au and f.get("editor"):
        au = ieee_names(names_list(f.get("editor")), w) + ", " + (w["eds"] if len(names_list(f["editor"])) > 1 else w["ed1"])
    if not au and f.get("organization"):
        au = esc_text(f["organization"])
    title = f.get("title", "")
    year = f.get("year", "")
    mon = month_str(f, lang)
    date = join_nonempty([mon, year], " ")
    vol = f"{w['vol']} {f['volume']}" if f.get("volume") else ""
    no = f"{w['no']} {f['number']}" if f.get("number") and t in ("article",) else ""
    pg = ""
    if f.get("pages"):
        pp = pages_fmt(f["pages"])
        pg = f"{w['pp'] if '--' in pp else w['p']} {pp}"
    doi = doi_clean(f.get("doi", ""))
    url = f.get("url", "")
    tail = ""
    if doi:
        tail = f", doi: \\href{{https://doi.org/{doi}}}{{{doi}}}."
    elif url:
        acc = f" {w['accessed']} {date_dmy(f['urldate'])}." if f.get("urldate") else ""
        tail = f".{acc} {w['online']} {url_tex(url)}"

    def finish(body):
        b = body.rstrip()
        tl = tail
        if b.endswith(",”"):
            if tl.startswith(","):
                tl = tl[1:]
            elif tl.startswith("."):
                b, tl = b[:-2] + ".”", tl[1:]
            elif not tl:
                return b[:-2] + ".”"
        else:
            b = b.rstrip(",")
        if tl:
            return b + tl if tl[0] in ",." else b + " " + tl.lstrip()
        return end_dot(b)

    if is_arxiv(e):
        return finish(f"{au}, {ieee_title(title, lang)} " + join_nonempty([date, "arXiv:" + arxiv_id(e)]))
    if t == "article":
        return finish(f"{au}, {ieee_title(title, lang)} \\textit{{{esc_text(f.get('journal', ''))}}}, "
                      + join_nonempty([vol, no, pg, date]))
    if t in ("inproceedings", "conference"):
        return finish(f"{au}, {ieee_title(title, lang)} {w['in']} \\textit{{{esc_text(f.get('booktitle', ''))}}}, "
                      + join_nonempty([vol, esc_text(f.get("address", "")), date, pg]))
    if t == "incollection":
        eds = names_list(f.get("editor"))
        ed = (ieee_names(eds, w) + ", " + (w["eds"] if len(eds) > 1 else w["ed1"])) if eds else ""
        pubs = join_nonempty([esc_text(f.get("address", "")), esc_text(f.get("publisher", ""))], ": ")
        return finish(f"{au}, {ieee_title(title, lang)} {w['in']} \\textit{{{esc_text(f.get('booktitle', ''))}}}, "
                      + join_nonempty([ed, pubs, year, pg]))
    if t in ("book", "manual"):
        edn = edition(f.get("edition"), lang)
        pubs = join_nonempty([esc_text(f.get("address", "")), esc_text(f.get("publisher", f.get("organization", "")))], ": ")
        head = join_nonempty([au, f"\\textit{{{esc_text(title)}}}", edn])
        return finish(end_dot(head) + " " + join_nonempty([pubs, year]))
    if t == "techreport":
        kind = f.get("type", w["techrep"])
        return finish(f"{au}, {ieee_title(title, lang)} " + join_nonempty([
            esc_text(f.get("institution", "")), esc_text(f.get("address", "")),
            join_nonempty([kind, f.get("number", "")], " "), date]))
    if t in ("phdthesis", "mastersthesis"):
        kind = w["phd"] if t == "phdthesis" else w["ms"]
        return finish(f"{au}, {ieee_title(title, lang)} " + join_nonempty([
            kind, esc_text(f.get("school", "")), esc_text(f.get("address", "")), date]))
    # misc / online / electronic
    where = esc_text(f.get("howpublished", "") if not f.get("howpublished", "").startswith("\\url") else "") \
        or esc_text(f.get("publisher", f.get("organization", "")))
    return finish(f"{au + ', ' if au else ''}{ieee_title(title, lang)} " + join_nonempty([where, date]))


# ----------------------------------------------------------------- DSTU 8302:2015 (simplified)

def dstu_names(ns, w):
    others = any(n.get("others") for n in ns)
    ns = [n for n in ns if not n.get("others")]

    def one(n):
        if "corporate" in n:
            return n["corporate"]
        ini = initials(n["first"])
        return f"{n['last']}~{ini.replace(' ', '~')}" if ini else n["last"]
    if not ns:
        return ""
    if len(ns) > 4 or others:
        return ", ".join(one(n) for n in ns[:3]) + " " + w["etal"]
    return ", ".join(one(n) for n in ns)


def fmt_dstu(e, doc_lang):
    lang = src_lang(e)
    w = WORDS["dstu"][lang]
    acc = WORDS["dstu"]["access"][doc_lang if doc_lang in ("uk", "en") else "en"]
    f = e["fields"]
    t = e["type"]
    au = dstu_names(names_list(f.get("author")), w)
    title = esc_text(f.get("title", ""))
    year = f.get("year", "")
    vol = f"{w['vol']} {f['volume']}" if f.get("volume") else ""
    no = f"{w['no']} {f['number']}" if f.get("number") and t == "article" else ""
    pg = f"{w['p']} {pages_fmt(f['pages'])}" if f.get("pages") else ""
    tot = f"{f['pagetotal']} {w['pages_total']}" if f.get("pagetotal") else ""
    doi = doi_clean(f.get("doi", ""))
    url = f.get("url", "")
    tail = []
    if doi:
        tail.append(f"DOI: \\href{{https://doi.org/{doi}}}{{{doi}}}.")
    if url and not doi:
        d = f" ({acc}: {date_dmy(f['urldate'])})" if f.get("urldate") else ""
        tail.append(f"URL: {url_tex(url)}{d}.")
    lead = (end_dot(au) + " ") if au else ""
    if t == "article" and not is_arxiv(e):
        parts = [f"{lead}{end_dot(title)}", end_dot(esc_text(f.get("journal", ""))), end_dot(year) if year else "",
                 end_dot(join_nonempty([vol, no])) if (vol or no) else "", end_dot(pg) if pg else ""]
    elif is_arxiv(e):
        parts = [f"{lead}{end_dot(title)}", f"arXiv:{arxiv_id(e)}.", end_dot(year) if year else ""]
        if not url:
            tail.append(f"URL: {url_tex('https://arxiv.org/abs/' + arxiv_id(e))}"
                        + (f" ({acc}: {date_dmy(f['urldate'])})." if f.get("urldate") else "."))
    elif t in ("inproceedings", "conference", "incollection"):
        where = join_nonempty([esc_text(f.get("address", "")), year])
        parts = [f"{lead}{end_dot(title)}", end_dot(esc_text(f.get("booktitle", ""))),
                 end_dot(where) if where else "", end_dot(vol) if vol else "", end_dot(pg) if pg else ""]
    elif t in ("book", "manual"):
        edn = end_dot(edition(f.get("edition"), lang)) if f.get("edition") else ""
        pub = join_nonempty([esc_text(f.get("address", "")), esc_text(f.get("publisher", f.get("organization", "")))], " : ")
        parts = [f"{lead}{end_dot(title)}", edn, end_dot(join_nonempty([pub, year])), end_dot(tot) if tot else ""]
    elif t == "techreport":
        kind = f.get("type", w["techrep"])
        pub = join_nonempty([esc_text(f.get("address", "")), esc_text(f.get("institution", ""))], " : ")
        num = f" {f['number']}" if f.get("number") else ""
        parts = [f"{lead}{title} : {kind}{num}.", end_dot(join_nonempty([pub, year])), end_dot(tot) if tot else ""]
    elif t in ("phdthesis", "mastersthesis"):
        kind = w["phd"] if t == "phdthesis" else w["ms"]
        parts = [f"{lead}{title} : {end_dot(kind)}", end_dot(join_nonempty([esc_text(f.get("school", "")), esc_text(f.get("address", ""))])),
                 end_dot(year) if year else "", end_dot(tot) if tot else ""]
    else:
        site = f.get("howpublished", "") if "\\url" not in f.get("howpublished", "") else ""
        site = esc_text(site or f.get("publisher", f.get("organization", "")))
        parts = [f"{lead}{end_dot(title)}", end_dot(site) if site else "", end_dot(year) if year else ""]
    return " ".join(p for p in parts + tail if p)


# ----------------------------------------------------------------- APA 7

def apa_names(ns, w):
    others = any(n.get("others") for n in ns)
    ns = [n for n in ns if not n.get("others")]

    def one(n):
        if "corporate" in n:
            return n["corporate"]
        ini = initials(n["first"])
        return f"{n['last']}, {ini}" if ini else n["last"]
    if not ns:
        return ""
    conj = f", {w['amp']} " if w["amp"] == "\\&" else f" {w['amp']} "
    if others:
        return ", ".join(one(n) for n in ns) + ", " + w["etal"]
    if len(ns) == 1:
        return one(ns[0])
    if len(ns) <= 20:
        return ", ".join(one(n) for n in ns[:-1]) + conj + one(ns[-1])
    return ", ".join(one(n) for n in ns[:19]) + ", . . . " + one(ns[-1])


def apa_label(e, w):
    ns = [n for n in names_list(e["fields"].get("author") or e["fields"].get("editor")) if not n.get("others")]
    last = lambda n: n.get("corporate") or n.get("last", "")
    if not ns:
        return strip_braces(e["fields"].get("organization") or e["fields"].get("title", "?")[:30])
    others = any(n.get("others") for n in names_list(e["fields"].get("author") or e["fields"].get("editor")))
    if len(ns) == 1 and not others:
        return strip_braces(last(ns[0]))
    if len(ns) == 2 and not others:
        return f"{strip_braces(last(ns[0]))} {w['amp']} {strip_braces(last(ns[1]))}"
    return f"{strip_braces(last(ns[0]))} {w['etal']}"


def fmt_apa(e, lang, suffix=""):
    w = WORDS["apa"][lang]
    f = e["fields"]
    t = e["type"]
    au = apa_names(names_list(f.get("author")), w)
    if not au and f.get("editor"):
        au = apa_names(names_list(f.get("editor")), w) + " (Eds.)"
    if not au:
        au = esc_text(f.get("organization", ""))
    year = (f.get("year") or w["nd"]) + suffix
    title = esc_text(f.get("title", ""))
    doi = doi_clean(f.get("doi", ""))
    link = url_tex("https://doi.org/" + doi) if doi else (url_tex(f["url"]) if f.get("url") else "")
    head = f"{end_dot(au)} ({year})." if au else ""
    pg = pages_fmt(f.get("pages", ""))
    if is_arxiv(e):
        body = f"\\textit{{{title}}} (arXiv:{arxiv_id(e)}). arXiv."
        if not link:
            link = url_tex("https://arxiv.org/abs/" + arxiv_id(e))
    elif t == "article":
        vol = f"\\textit{{{f['volume']}}}" if f.get("volume") else ""
        no = f"({f['number']})" if f.get("number") else ""
        body = f"{end_dot(title)} \\textit{{{esc_text(f.get('journal', ''))}}}" + (f", {vol}{no}" if vol or no else "") + (f", {pg}" if pg else "") + "."
    elif t in ("inproceedings", "conference", "incollection"):
        pp = f" ({w['pp']} {pg})" if pg else ""
        pub = f" {end_dot(esc_text(f['publisher']))}" if f.get("publisher") else ""
        body = f"{end_dot(title)} {w['in']} \\textit{{{esc_text(f.get('booktitle', ''))}}}{pp}.{pub}"
    elif t in ("book", "manual"):
        edn = f" ({edition(f.get('edition'), lang)})" if f.get("edition") else ""
        pub = esc_text(f.get("publisher", f.get("organization", "")))
        body = f"\\textit{{{title}}}{edn}." + (f" {end_dot(pub)}" if pub else "")
    elif t == "techreport":
        num = f" ({w['report']} {f['number']})" if f.get("number") else ""
        body = f"\\textit{{{title}}}{num}. {end_dot(esc_text(f.get('institution', '')))}"
    elif t in ("phdthesis", "mastersthesis"):
        kind = w["phd"] if t == "phdthesis" else w["ms"]
        body = f"\\textit{{{title}}} [{kind}, {esc_text(f.get('school', ''))}]."
    else:
        site = f.get("howpublished", "") if "\\url" not in f.get("howpublished", "") else ""
        site = esc_text(site or f.get("publisher", f.get("organization", "")))
        body = f"\\textit{{{title}}}." + (f" {end_dot(site)}" if site else "")
    if not head:
        head = f"{body} ({year})."
        body = ""
    return " ".join(p for p in [head, body, link] if p)


# ----------------------------------------------------------------- ordering

def expand_tex(path, seen=None):
    seen = seen or set()
    p = Path(path)
    if not p.suffix:
        p = p.with_suffix(".tex")
    if not p.exists() or p.resolve() in seen:
        return ""
    seen.add(p.resolve())
    text = re.sub(r"(?<!\\)%.*", "", p.read_text(encoding="utf-8", errors="replace"))

    def repl(m):
        return expand_tex(p.parent / m.group(1), seen)
    return re.sub(r"\\(?:input|include)\s*\{([^}]+)\}", repl, text)


CITE_RE = re.compile(r"\\(no)?cite[a-zA-Z]*\*?\s*(?:\[[^\]]*\]\s*){0,2}\{([^}]*)\}")


def cited_keys(tex_path):
    text = expand_tex(tex_path)
    order, nocite_all = [], False
    for m in CITE_RE.finditer(text):
        for k in m.group(2).split(","):
            k = k.strip()
            if not k:
                continue
            if k == "*":
                nocite_all = True
                continue
            if k not in order:
                order.append(k)
    return order, nocite_all


def uk_sort_key(s, doc_lang):
    s = strip_braces(s).casefold()
    cyr = bool(CYR_RE.match(s))
    out = []
    for ch in s:
        if ch in UK_ALPHABET:
            out.append(100 + UK_ALPHABET.index(ch))
        else:
            out.append(1000 + ord(ch))
    group = (0 if cyr else 1) if doc_lang == "uk" else (1 if cyr else 0)
    return (group, out)


def first_author_last(e):
    ns = names_list(e["fields"].get("author") or e["fields"].get("editor"))
    ns = [n for n in ns if not n.get("others")]
    if not ns:
        return e["fields"].get("organization") or e["fields"].get("title", "")
    return ns[0].get("corporate") or ns[0].get("last", "")


# ----------------------------------------------------------------- main API

def check_complete(e):
    f = e["fields"]
    req = REQUIRED.get(e["type"], REQUIRED["misc"])
    missing = [("|".join(alts)) for alts in req if not any(f.get(a) for a in alts)]
    return missing


def render(bib_path, tex_path, style, doc_lang, out_path, order=None, include_all=False):
    doc_lang = "uk" if doc_lang in ("uk", "ukrainian") else "en"
    bib_text = Path(bib_path).read_text(encoding="utf-8") if Path(bib_path).exists() else ""
    entries = parse_bib(bib_text)
    by_key = {e["key"]: e for e in entries}
    cited, nocite_all = cited_keys(tex_path) if tex_path else ([], True)
    missing = [k for k in cited if k not in by_key]
    use_all = include_all or nocite_all
    chosen = [by_key[k] for k in cited if k in by_key]
    if use_all:
        chosen += [e for e in entries if e["key"] not in cited]
    uncited = [e["key"] for e in entries if e["key"] not in cited] if not use_all else []
    order = order or ("alpha" if style == "apa" else "cite")
    if order == "alpha":
        chosen.sort(key=lambda e: (uk_sort_key(first_author_last(e), doc_lang), e["fields"].get("year", ""),
                                   strip_braces(e["fields"].get("title", "")).casefold()))
    incomplete = []
    for e in chosen:
        miss = check_complete(e)
        if miss:
            incomplete.append(f"{e['key']}: missing {', '.join(miss)}")
        if style == "dstu" and e["fields"].get("url") and not e["fields"].get("urldate") and not e["fields"].get("doi"):
            incomplete.append(f"{e['key']}: URL without urldate (DSTU needs the access date)")

    lines = [f"% Generated by bibfmt.py (style={style}, lang={doc_lang}, order={order}). "
             "Edit refs.bib, not this file.",
             f"\\setcounter{{skedsrc}}{{{len(chosen)}}}"]
    width = "99" if len(chosen) >= 10 else "9"
    lines.append(f"\\begin{{thebibliography}}{{{width}}}")
    if style == "apa":
        # year disambiguation: same label and year -> a, b, ...
        labels = {}
        for e in chosen:
            w = WORDS["apa"][src_lang(e) if doc_lang == "uk" else "en"]
            lab = apa_label(e, w)
            labels.setdefault((lab, e["fields"].get("year", "")), []).append(e["key"])
        for e in chosen:
            lang = src_lang(e) if doc_lang == "uk" else "en"
            w = WORDS["apa"][lang]
            lab = apa_label(e, w)
            yr = e["fields"].get("year") or w["nd"]
            group = labels[(lab, e["fields"].get("year", ""))]
            suffix = "abcdefghijklmnopqrstuvwxyz"[group.index(e["key"])] if len(group) > 1 else ""
            lab_tex = lab.replace(" ", "~", 1) if w["etal"] in lab else lab
            lines.append(f"\\bibitem[{{{esc_text(lab_tex)}}}({yr}{suffix})]{{{e['key']}}}")
            lines.append(fmt_apa(e, lang, suffix))
            lines.append("")
    else:
        for e in chosen:
            lines.append(f"\\bibitem{{{e['key']}}}")
            lines.append(fmt_ieee(e, doc_lang) if style == "ieee" else fmt_dstu(e, doc_lang))
            lines.append("")
    lines.append("\\end{thebibliography}")
    Path(out_path).write_text("\n".join(lines) + "\n", encoding="utf-8")
    return {
        "style": style, "lang": doc_lang, "order": order, "entries_in_bib": len(entries),
        "rendered": len(chosen), "cited": cited, "missing_keys": missing,
        "uncited": uncited, "incomplete": incomplete, "out": str(out_path),
    }


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--bib", required=True)
    ap.add_argument("--tex", help="main .tex (follows \\input) to find citation order")
    ap.add_argument("--style", choices=["ieee", "dstu", "apa"], default="ieee")
    ap.add_argument("--lang", default="uk")
    ap.add_argument("--order", choices=["cite", "alpha"])
    ap.add_argument("--all", action="store_true", help="render uncited entries too")
    ap.add_argument("--out", default="references.tex")
    a = ap.parse_args()
    rep = render(a.bib, a.tex, a.style, a.lang, a.out, a.order, a.all)
    print(json.dumps(rep, ensure_ascii=False, indent=2))
    sys.exit(1 if rep["missing_keys"] else 0)


if __name__ == "__main__":
    main()
