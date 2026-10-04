#!/usr/bin/env python3
"""SKED session engine.

Implements the state side of the SKED method (Socratic Knowledge Elicitation
& Documentation): session parameters, the append-only knowledge ledger K(t),
the convergence distance delta, the K* export, coverage of K* in the document
(C_q) and the quality score Q(R) = alpha*C_q + beta*Coh + gamma*F_c.

Standard library only. Python 3.8+.

Usage: python3 sked.py [--session DIR] <command> [options]
Run `python3 sked.py <command> -h` for command help.
"""
import argparse
import datetime as _dt
import hashlib
import json
import os
import re
import shutil
import sys
import unicodedata
from pathlib import Path

VERSION = "0.1.0"
PLUGIN_ROOT = Path(__file__).resolve().parent.parent
TEMPLATES = PLUGIN_ROOT / "templates"
DEFAULT_ROOT = "sked-sessions"

K_TYPES = ["claim", "definition", "assumption", "constraint", "decision",
           "requirement", "example"]
TYPES = K_TYPES + ["question", "source"]
STATUSES = ["proposed", "agreed", "contested", "open", "deferred",
            "resolved", "retracted"]
ORIGINS = ["H", "M", "S"]          # human, model, external source
PRIORITY_W = {"high": 3, "normal": 2, "low": 1}
VERIFIED = ["none", "human", "source"]
EDITABLE = ["text", "type", "priority", "refs", "term", "note", "bib",
            "bibkey", "origin", "section"]
PROFILES = ["ieee", "dstu", "apa"]

DEFAULT_PARAMS = {
    "epsilon": 0.05,        # delta threshold for convergence
    "stable_rounds": 2,     # consecutive rounds with delta < epsilon
    "min_rounds": 3,        # minimum dialogue rounds before convergence
    "max_rounds": 15,       # budget, then ask the human
    "weights": {"alpha": 0.4, "beta": 0.3, "gamma": 0.3},
    "q_threshold": 0.85,
    "overfull_tolerance_pt": 1.0,
    "max_fix_loops": 3,
}

L10N = {
    "uk": {
        "kstar": "Консенсусний простір знань K*",
        "session": "Сесія", "round": "раунд", "generated": "сформовано",
        "convergence": "конвергенція",
        "narrative": "Узгоджене розуміння",
        "narrative_todo": "(Короткий синтез узгодженого розуміння. Лише з записів нижче, без нових фактів.)",
        "claim": "Твердження", "definition": "Визначення термінів",
        "assumption": "Припущення", "constraint": "Обмеження та межі",
        "decision": "Рішення", "requirement": "Вимоги", "example": "Приклади",
        "open": "Відкриті та відкладені питання (обмеження документа)",
        "sources": "Джерела", "term": "Термін", "meaning": "Значення",
        "none": "немає",
    },
    "en": {
        "kstar": "Consensus knowledge space K*",
        "session": "Session", "round": "round", "generated": "generated",
        "convergence": "convergence",
        "narrative": "Agreed understanding",
        "narrative_todo": "(Short synthesis of the agreed understanding. Only from the entries below, no new facts.)",
        "claim": "Claims", "definition": "Definitions",
        "assumption": "Assumptions", "constraint": "Constraints and scope",
        "decision": "Decisions", "requirement": "Requirements", "example": "Examples",
        "open": "Open and deferred questions (document limitations)",
        "sources": "Sources", "term": "Term", "meaning": "Meaning",
        "none": "none",
    },
}

UK_TRANSLIT = {
    "а": "a", "б": "b", "в": "v", "г": "h", "ґ": "g", "д": "d", "е": "e",
    "є": "ie", "ж": "zh", "з": "z", "и": "y", "і": "i", "ї": "i", "й": "i",
    "к": "k", "л": "l", "м": "m", "н": "n", "о": "o", "п": "p", "р": "r",
    "с": "s", "т": "t", "у": "u", "ф": "f", "х": "kh", "ц": "ts", "ч": "ch",
    "ш": "sh", "щ": "shch", "ь": "", "ю": "iu", "я": "ia", "'": "", "’": "",
    "ы": "y", "э": "e", "ё": "e", "ъ": "",
}


# ----------------------------------------------------------------- helpers

def now():
    return _dt.datetime.now().astimezone().isoformat(timespec="seconds")


def die(msg, code=1):
    print(f"ERROR: {msg}", file=sys.stderr)
    sys.exit(code)


def slugify(text, maxlen=48):
    out = []
    for ch in text.lower():
        if ch in UK_TRANSLIT:
            out.append(UK_TRANSLIT[ch])
        else:
            out.append(ch)
    s = unicodedata.normalize("NFKD", "".join(out))
    s = s.encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return (s[:maxlen].rstrip("-")) or "session"


def norm(text):
    t = unicodedata.normalize("NFC", text or "").casefold()
    return re.sub(r"\s+", " ", t).strip()


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        h.update(f.read())
    return h.hexdigest()


def latex_escape(s):
    if s is None:
        return ""
    rep = {"\\": r"\textbackslash{}", "{": r"\{", "}": r"\}", "$": r"\$",
           "&": r"\&", "#": r"\#", "^": r"\^{}", "_": r"\_", "%": r"\%",
           "~": r"\textasciitilde{}"}
    return "".join(rep.get(c, c) for c in str(s))


def dig(d, path, default=None):
    cur = d
    for p in path.split("."):
        if not isinstance(cur, dict) or p not in cur:
            return default
        cur = cur[p]
    return cur


# ----------------------------------------------------------------- session

class Session:
    def __init__(self, path):
        self.dir = Path(path).resolve()
        self.file = self.dir / "session.json"
        self.ledger = self.dir / "ledger.jsonl"
        self.dialogue = self.dir / "dialogue.jsonl"
        if not self.file.exists():
            die(f"no session.json in {self.dir}")
        self.data = json.loads(self.file.read_text(encoding="utf-8"))

    def save(self):
        self.data["updated"] = now()
        tmp = self.file.with_suffix(".json.tmp")
        tmp.write_text(json.dumps(self.data, ensure_ascii=False, indent=2),
                       encoding="utf-8")
        tmp.replace(self.file)

    @property
    def round(self):
        return self.data.get("round", 0)

    @property
    def doc_lang(self):
        lang = dig(self.data, "language.document", "uk")
        return lang if lang in L10N else "en"

    def events(self):
        if not self.ledger.exists():
            return []
        out = []
        for i, line in enumerate(self.ledger.read_text(encoding="utf-8").splitlines(), 1):
            line = line.strip()
            if not line:
                continue
            try:
                out.append(json.loads(line))
            except json.JSONDecodeError as e:
                die(f"ledger.jsonl line {i} is not valid JSON: {e}")
        return out

    def append(self, path, records):
        with open(path, "a", encoding="utf-8") as f:
            for r in records:
                f.write(json.dumps(r, ensure_ascii=False) + "\n")

    def turns(self):
        if not self.dialogue.exists():
            return []
        return [json.loads(l) for l in self.dialogue.read_text(encoding="utf-8").splitlines() if l.strip()]


def find_session(arg):
    """Resolve the session directory from --session, $SKED_SESSION or cwd."""
    cand = arg or os.environ.get("SKED_SESSION")
    if cand:
        p = Path(cand)
        if (p / "session.json").exists():
            return Session(p)
        die(f"{p} is not a SKED session (no session.json)")
    cwd = Path.cwd()
    if (cwd / "session.json").exists():
        return Session(cwd)
    root = cwd / DEFAULT_ROOT
    sessions = sorted(root.glob("*/session.json")) if root.exists() else []
    if len(sessions) == 1:
        return Session(sessions[0].parent)
    if not sessions:
        die("no session found. Use `init`, or pass --session DIR")
    names = ", ".join(s.parent.name for s in sessions)
    die(f"several sessions found ({names}). Pass --session DIR")


# ----------------------------------------------------------------- ledger

def fold(events, upto_round=None, include_retracted=False):
    """Replay ledger events into the knowledge state K(t)."""
    entries = {}
    for ev in events:
        if upto_round is not None and ev.get("round", 0) > upto_round:
            continue
        op, eid = ev.get("op"), ev.get("id")
        if op == "add":
            e = {k: v for k, v in ev.items() if k not in ("op", "ts")}
            e["created"] = ev.get("round", 0)
            e["updated"] = ev.get("round", 0)
            e["history"] = []
            entries[eid] = e
        elif eid in entries:
            e = entries[eid]
            e["updated"] = ev.get("round", 0)
            e["history"].append({k: v for k, v in ev.items() if k != "id"})
            if op == "edit":
                for k in EDITABLE:
                    if k in ev:
                        e[k] = ev[k]
                e["edited"] = True
            elif op == "status":
                e["status"] = ev["status"]
                # the human confirming a model proposal counts as human verification
                if ev["status"] == "agreed" and e.get("origin") == "M" and e.get("verified", "none") == "none":
                    e["verified"] = "human"
                if ev.get("note"):
                    e["note"] = ev["note"]
            elif op == "verify":
                e["verified"] = ev["verified"]
                if ev.get("refs"):
                    e["refs"] = sorted(set(e.get("refs", [])) | set(ev["refs"]))
            elif op == "retract":
                e["status"] = "retracted"
                if ev.get("note"):
                    e["note"] = ev["note"]
    if not include_retracted:
        entries = {k: v for k, v in entries.items() if v.get("status") != "retracted"}
    return entries


def id_sort_key(eid):
    m = re.match(r"([A-Z]+)(\d+)$", eid)
    return (m.group(1), int(m.group(2))) if m else (eid, 0)


def next_id(all_entries, etype):
    prefix = {"question": "Q", "source": "S"}.get(etype, "K")
    nums = [int(k[len(prefix):]) for k in all_entries
            if k.startswith(prefix) and k[len(prefix):].isdigit()]
    return f"{prefix}{(max(nums) + 1) if nums else 1}"


def state_set(entries):
    return {(eid, norm(e.get("text", "")), e.get("status")) for eid, e in entries.items()}


def jaccard_distance(a, b):
    if not a and not b:
        return 0.0
    return 1.0 - len(a & b) / len(a | b)


def apply_ops(sess, ops):
    events = sess.events()
    all_entries = fold(events, include_retracted=True)
    rnd = sess.round
    ts = now()
    new_events, new_turns, assigned = [], [], []
    for n, op in enumerate(ops, 1):
        kind = op.get("op")
        # resolve $n placeholders (n-th add in this batch)
        for fld in ("refs",):
            if isinstance(op.get(fld), list):
                op[fld] = [assigned[int(r[1:]) - 1] if isinstance(r, str) and re.fullmatch(r"\$\d+", r) else r
                           for r in op[fld]]
        if isinstance(op.get("id"), str) and re.fullmatch(r"\$\d+", op["id"]):
            op["id"] = assigned[int(op["id"][1:]) - 1]
        if kind == "add":
            etype = op.get("type")
            if etype not in TYPES:
                die(f"op {n}: type must be one of {TYPES}")
            if not op.get("text"):
                die(f"op {n}: add needs text")
            origin = op.get("origin", "H")
            if origin not in ORIGINS:
                die(f"op {n}: origin must be one of {ORIGINS}")
            if etype == "question":
                status = op.get("status", "open")
            elif origin == "M":
                status = op.get("status", "proposed")
            else:
                status = op.get("status", "agreed")
            if status not in STATUSES:
                die(f"op {n}: bad status {status}")
            prio = op.get("priority", "normal")
            if prio not in PRIORITY_W:
                die(f"op {n}: priority must be high|normal|low")
            verified = op.get("verified", "human" if origin == "H" else "none")
            if verified not in VERIFIED:
                die(f"op {n}: verified must be one of {VERIFIED}")
            eid = next_id(all_entries, etype)
            ev = {"ts": ts, "round": rnd, "op": "add", "id": eid, "type": etype,
                  "text": op["text"].strip(), "origin": origin, "status": status,
                  "priority": prio, "verified": verified,
                  "refs": op.get("refs", [])}
            for k in ("term", "note", "bib", "bibkey", "section"):
                if op.get(k):
                    ev[k] = op[k]
            if etype == "source" and not op.get("bibkey") and op.get("bib"):
                m = re.match(r"\s*@\w+\s*\{\s*([^,\s]+)", op["bib"])
                if m:
                    ev["bibkey"] = m.group(1)
            all_entries[eid] = dict(ev)
            new_events.append(ev)
            assigned.append(eid)
        elif kind in ("edit", "status", "verify", "retract"):
            eid = op.get("id")
            if eid not in all_entries:
                die(f"op {n}: unknown id {eid}")
            ev = {"ts": ts, "round": rnd, "op": kind, "id": eid}
            if kind == "edit":
                changed = {k: op[k] for k in EDITABLE if k in op}
                if not changed:
                    die(f"op {n}: edit needs at least one of {EDITABLE}")
                if "type" in changed and changed["type"] not in TYPES:
                    die(f"op {n}: bad type")
                if "priority" in changed and changed["priority"] not in PRIORITY_W:
                    die(f"op {n}: bad priority")
                ev.update(changed)
            elif kind == "status":
                if op.get("status") not in STATUSES:
                    die(f"op {n}: status must be one of {STATUSES}")
                ev["status"] = op["status"]
            elif kind == "verify":
                if op.get("verified") not in VERIFIED:
                    die(f"op {n}: verified must be one of {VERIFIED}")
                ev["verified"] = op["verified"]
                if op.get("refs"):
                    ev["refs"] = op["refs"]
            if op.get("note"):
                ev["note"] = op["note"]
            new_events.append(ev)
        elif kind == "turn":
            t = {"ts": ts, "round": rnd}
            for k in ("move", "q_M", "a_H", "q_H", "a_M", "summary"):
                if op.get(k):
                    t[k] = op[k]
            new_turns.append(t)
        else:
            die(f"op {n}: unknown op '{kind}' (add|edit|status|verify|retract|turn)")
    if new_events:
        sess.append(sess.ledger, new_events)
    if new_turns:
        sess.append(sess.dialogue, new_turns)
    sess.save()
    return assigned, new_events, new_turns


# ----------------------------------------------------------------- metrics

def round_stats(sess, rnd):
    events = sess.events()
    cur = fold(events, upto_round=rnd)
    prev = fold(events, upto_round=rnd - 1) if rnd > 0 else {}
    delta = jaccard_distance(state_set(cur), state_set(prev))
    evs = [e for e in events if e.get("round", 0) == rnd]
    return {
        "round": rnd,
        "delta": round(delta, 4),
        "active": len(cur),
        "added": sum(1 for e in evs if e["op"] == "add"),
        "edited": sum(1 for e in evs if e["op"] == "edit"),
        "status_changes": sum(1 for e in evs if e["op"] == "status"),
        "retracted": sum(1 for e in evs if e["op"] == "retract"),
        "open_questions": sum(1 for e in cur.values() if e["type"] == "question" and e["status"] == "open"),
        "contested": sum(1 for e in cur.values() if e["status"] == "contested"),
        "closed": now(),
    }


def m_acceptance(events):
    """Share of model-origin proposals the human accepted without any edit.

    A very high share over many decisions is a warning sign that the dialogue
    is converging on the model's frame instead of the human's knowledge.
    """
    entries = fold(events, include_retracted=True)
    decided = unchanged = 0
    for e in entries.values():
        if e.get("origin") != "M" or e["type"] in ("question", "source"):
            continue
        if e["status"] in ("agreed", "retracted", "contested"):
            decided += 1
            if e["status"] == "agreed" and not e.get("edited"):
                unchanged += 1
    return decided, unchanged


def convergence(sess):
    p = {**DEFAULT_PARAMS, **sess.data.get("params", {})}
    metrics = [m for m in sess.data.get("metrics", []) if m["round"] >= 1]
    entries = fold(sess.events())
    reasons = []
    k, eps = int(p["stable_rounds"]), float(p["epsilon"])
    deltas = [m["delta"] for m in metrics]
    if len(metrics) < int(p["min_rounds"]):
        reasons.append(f"only {len(metrics)} dialogue round(s) closed, minimum is {p['min_rounds']}")
    if len(deltas) < k or not all(d < eps for d in deltas[-k:]):
        tail = ", ".join(f"{d:.3f}" for d in deltas[-k:]) or "n/a"
        reasons.append(f"delta not below epsilon={eps} for {k} consecutive rounds (last: {tail})")
    open_high = sorted((eid for eid, e in entries.items()
                        if e["type"] == "question" and e["status"] == "open"
                        and e.get("priority") == "high"), key=id_sort_key)
    if open_high:
        reasons.append("open high-priority questions: " + ", ".join(open_high))
    contested = sorted((eid for eid, e in entries.items() if e["status"] == "contested"), key=id_sort_key)
    if contested:
        reasons.append("contested entries: " + ", ".join(contested))
    pending_m = sorted((eid for eid, e in entries.items()
                        if e.get("origin") == "M" and e["status"] == "proposed"
                        and e["type"] not in ("question", "source")), key=id_sort_key)
    return {
        "converged": not reasons,
        "reasons": reasons,
        "budget_reached": len(metrics) >= int(p["max_rounds"]),
        "rounds": len(metrics),
        "pending_model_proposals": pending_m,
    }


# ----------------------------------------------------------------- views

def fmt_entry(eid, e):
    flags = [e["type"], e.get("priority", "normal"), e.get("origin", "?"), e["status"]]
    v = e.get("verified", "none")
    if v != "none":
        flags.append("verified:" + v)
    refs = (" refs:" + ",".join(e["refs"])) if e.get("refs") else ""
    term = f"«{e['term']}» " if e.get("term") else ""
    key = f" bibkey:{e['bibkey']}" if e.get("bibkey") else ""
    return f"{eid} [{' | '.join(flags)}]{refs}{key} {term}{e.get('text', '')}"


def entries_md(entries):
    return "\n".join("- " + fmt_entry(eid, entries[eid]) for eid in sorted(entries, key=id_sort_key))


def status_report(sess):
    d = sess.data
    events = sess.events()
    entries = fold(events)
    by_type = {}
    for e in entries.values():
        by_type.setdefault(e["type"], {}).setdefault(e["status"], 0)
        by_type[e["type"]][e["status"]] += 1
    conv = convergence(sess)
    decided, unchanged = m_acceptance(events)
    phase = d.get("phase")
    next_step = {
        1: "Phase 1: collect context packet, write K(0) frame, ask first question, then round-close and phase 2 (skill sked-start).",
        2: "Phase 2: run Socratic rounds until convergence (skill sked-dialogue).",
        3: "Phase 3: synthesize K*, get human confirmation, `confirm kstar` (skill sked-synthesis).",
        4: "Phase 4: agree document structure, `confirm structure` (skill sked-structure).",
        5: "Phase 5: scaffold, write LaTeX, build, run quality gate (skills sked-latex, sked-quality).",
        "done": "Delivered. Reopen with `phase 5 --force` to revise.",
    }.get(phase, "")
    return {
        "session": str(sess.dir),
        "topic": d.get("topic"),
        "phase": phase,
        "round": sess.round,
        "profile": d.get("profile"),
        "language": d.get("language"),
        "mode": d.get("mode"),
        "entries": by_type,
        "active_total": len(entries),
        "last_deltas": [m["delta"] for m in d.get("metrics", [])][-5:],
        "convergence": conv,
        "converged": d.get("converged"),
        "model_proposals_decided": decided,
        "model_proposals_accepted_unchanged": unchanged,
        "gates": d.get("gates", {}),
        "next": next_step,
    }


# ----------------------------------------------------------------- K*

NARR_BEGIN = "<!-- SKED:NARRATIVE:BEGIN -->"
NARR_END = "<!-- SKED:NARRATIVE:END -->"


def build_kstar(sess, out_path):
    L = L10N[sess.doc_lang]
    entries = fold(sess.events())
    narrative = L["narrative_todo"]
    if out_path.exists():
        old = out_path.read_text(encoding="utf-8")
        m = re.search(re.escape(NARR_BEGIN) + r"\n(.*?)\n" + re.escape(NARR_END), old, re.S)
        if m and m.group(1).strip():
            narrative = m.group(1).strip()
    conv = sess.data.get("converged") or {}
    lines = [f"# {L['kstar']}: {sess.data.get('topic', '')}", "",
             f"{L['session']} `{sess.dir.name}`, {L['round']} {sess.round}, "
             f"{L['generated']} {now()[:10]}, {L['convergence']}: {conv.get('by', '-')}", "",
             f"## {L['narrative']}", "", NARR_BEGIN, narrative, NARR_END, ""]

    agreed = {k: v for k, v in entries.items() if v["status"] in ("agreed", "resolved") and v["type"] in K_TYPES}
    defs = {k: v for k, v in agreed.items() if v["type"] == "definition"}
    if defs:
        lines += [f"## {L['definition']}", "", f"| ID | {L['term']} | {L['meaning']} |", "|---|---|---|"]
        for k in sorted(defs, key=id_sort_key):
            e = defs[k]
            lines.append(f"| {k} | {e.get('term', '')} | {e['text'].replace('|', '/')} |")
        lines.append("")
    for t in ["claim", "requirement", "constraint", "decision", "assumption", "example"]:
        group = {k: v for k, v in agreed.items() if v["type"] == t}
        if not group:
            continue
        lines += [f"## {L[t]}", ""]
        for k in sorted(group, key=lambda x: (-PRIORITY_W.get(group[x].get("priority", "normal"), 2), id_sort_key(x))):
            e = group[k]
            tag = f"{e.get('priority', 'normal')}, {e.get('origin')}"
            if e.get("verified", "none") != "none":
                tag += f", verified:{e['verified']}"
            refs = f" [{', '.join(e['refs'])}]" if e.get("refs") else ""
            lines.append(f"- **{k}** ({tag}){refs} {e['text']}")
        lines.append("")
    openq = {k: v for k, v in entries.items()
             if v["type"] == "question" and v["status"] in ("open", "deferred")}
    lines += [f"## {L['open']}", ""]
    if openq:
        for k in sorted(openq, key=id_sort_key):
            e = openq[k]
            note = f" ({e['note']})" if e.get("note") else ""
            lines.append(f"- **{k}** [{e['status']}, {e.get('priority')}] {e['text']}{note}")
    else:
        lines.append(f"- {L['none']}")
    lines.append("")
    srcs = {k: v for k, v in entries.items() if v["type"] == "source"}
    if srcs:
        lines += [f"## {L['sources']}", ""]
        for k in sorted(srcs, key=id_sort_key):
            e = srcs[k]
            lines.append(f"- **{k}** `{e.get('bibkey', '?')}` (verified:{e.get('verified', 'none')}) {e['text']}")
        lines.append("")
    nonagreed = {k: v for k, v in entries.items()
                 if v["status"] in ("proposed", "contested") and v["type"] not in ("question", "source")}
    if nonagreed:
        lines += ["## NOT IN K* (proposed or contested, resolve before confirming)", ""]
        lines += ["- " + fmt_entry(k, nonagreed[k]) for k in sorted(nonagreed, key=id_sort_key)]
        lines.append("")
    out_path.write_text("\n".join(lines), encoding="utf-8")
    return len(agreed), len(openq), len(nonagreed)


# ----------------------------------------------------------------- coverage

TAG_RE = re.compile(r"\\sked\*?\s*\{([^}]*)\}")
ID_RE = re.compile(r"\b([KQS]\d+)\b")


def tex_files(report_dir):
    rd = Path(report_dir)
    return sorted(p for p in rd.rglob("*.tex") if "build" not in p.relative_to(rd).parts
                  and p.name != "references.tex")


def strip_tex_comments(text):
    return re.sub(r"(?<!\\)%.*", "", text)


def collect_ids(paths, mode):
    found = {}
    for p in paths:
        text = Path(p).read_text(encoding="utf-8", errors="replace")
        if mode == "tex":
            text = strip_tex_comments(text)
            for m in TAG_RE.finditer(text):
                for raw in m.group(1).split(","):
                    raw = raw.strip()
                    if raw:
                        found.setdefault(raw, set()).add(Path(p).name)
        else:
            for m in ID_RE.finditer(text):
                found.setdefault(m.group(1), set()).add(Path(p).name)
    return found


def coverage(sess, report_dir=None, plan=None):
    entries = fold(sess.events(), include_retracted=True)
    if plan:
        found = collect_ids([plan], "plan")
    else:
        found = collect_ids(tex_files(report_dir), "tex")
    target = {k: v for k, v in entries.items()
              if (v["type"] in K_TYPES and v["status"] in ("agreed", "resolved"))
              or (v["type"] == "question" and v["status"] == "deferred")}
    total_w = sum(PRIORITY_W.get(v.get("priority", "normal"), 2) for v in target.values())
    cov_w = sum(PRIORITY_W.get(v.get("priority", "normal"), 2) for k, v in target.items() if k in found)
    cq = (cov_w / total_w) if total_w else 1.0
    uncovered = sorted((k for k in target if k not in found), key=id_sort_key)
    unknown = sorted((k for k in found if k not in entries), key=id_sort_key)
    bad_status = sorted((k for k in found if k in entries and entries[k]["status"]
                         in ("retracted", "contested", "proposed", "open")), key=id_sort_key)
    unverified_numeric, unverified_m = [], []
    for k in found:
        e = entries.get(k)
        if not e or e.get("origin") != "M" or e["type"] in ("question", "source"):
            continue
        if e.get("verified", "none") != "source":
            (unverified_numeric if re.search(r"\d", e.get("text", "")) else unverified_m).append(k)
    return {
        "mode": "plan" if plan else "tex",
        "Cq": round(cq, 4),
        "target_entries": len(target),
        "covered_entries": sum(1 for k in target if k in found),
        "uncovered_high": [k for k in uncovered if target[k].get("priority") == "high"],
        "uncovered": uncovered,
        "unknown_ids": unknown,
        "non_agreed_ids_used": bad_status,
        "model_claims_with_figures_not_source_verified": sorted(unverified_numeric, key=id_sort_key),
        "model_claims_not_source_verified": sorted(unverified_m, key=id_sort_key),
        "used_sources": sorted({r for k in found if k in entries for r in entries[k].get("refs", [])}
                               | {k for k in found if k.startswith("S")}, key=id_sort_key),
    }


# ----------------------------------------------------------------- scaffold

def write_bib(sess, report_dir):
    entries = fold(sess.events())
    srcs = [entries[k] for k in sorted(entries, key=id_sort_key) if entries[k]["type"] == "source"]
    chunks = []
    missing = []
    for e in srcs:
        if e.get("bib"):
            chunks.append(f"% {e['id'] if 'id' in e else ''} verified={e.get('verified', 'none')}\n{e['bib'].strip()}\n")
        else:
            missing.append(e.get("id"))
    (Path(report_dir) / "refs.bib").write_text("\n".join(chunks), encoding="utf-8")
    return len(chunks), missing


def scaffold(sess, force=False):
    rd = sess.dir / "report"
    (rd / "sections").mkdir(parents=True, exist_ok=True)
    (rd / "figures").mkdir(exist_ok=True)
    shutil.copy2(TEMPLATES / "skedreport.cls", rd / "skedreport.cls")
    main = rd / "main.tex"
    if main.exists() and not force:
        created = False
    else:
        meta = dig(sess.data, "context.metadata", {}) or {}
        lang = dig(sess.data, "language.document", "uk")
        vals = {
            "PROFILE": sess.data.get("profile", "ieee"),
            "LANG": lang,
            "TITLE": latex_escape(meta.get("title") or sess.data.get("topic", "")),
            "SUBTITLE": latex_escape(meta.get("subtitle", "")),
            "AUTHOR": latex_escape(meta.get("author", "")),
            "AFFILIATION": latex_escape(meta.get("affiliation", "")),
            "ORGANIZATION": latex_escape(meta.get("organization", meta.get("affiliation", ""))),
            "DOCTYPE": latex_escape(meta.get("doc_type", "")),
            "VERSION": latex_escape(meta.get("version", "1.0.0")),
            "DATE": latex_escape(meta.get("date", "")),
            "CITY": latex_escape(meta.get("city", "")),
            "UDC": latex_escape(meta.get("udc", "")),
            "KEYWORDS": latex_escape(meta.get("keywords", "")),
            "PLATFORM": latex_escape(meta.get("platform", "")),
        }
        tpl = (TEMPLATES / "main.tex").read_text(encoding="utf-8")
        for k, v in vals.items():
            tpl = tpl.replace(f"@@{k}@@", v)
        main.write_text(tpl, encoding="utf-8")
        created = True
    n, missing = write_bib(sess, rd)
    return rd, created, n, missing


# ----------------------------------------------------------------- quality

FORBIDDEN_DEFAULT = []
PLACEHOLDER_RE = re.compile(r"TODO|FIXME|XXX|@@[A-Z]+@@|SKED:TODO")


def static_tex_checks(report_dir, forbid_chars):
    files = tex_files(report_dir)
    labels, refs = {}, set()
    placeholders, forbidden = [], []
    for p in files:
        raw = p.read_text(encoding="utf-8", errors="replace")
        text = strip_tex_comments(raw)
        for m in re.finditer(r"\\label\{([^}]+)\}", text):
            labels[m.group(1)] = p.name
        for m in re.finditer(r"\\(?:ref|eqref|pageref|autoref|cref|Cref|figref|tabref|algoref|lstref|secref|eqnref|Figref|Tabref|Algoref|Lstref|Secref)\*?\{([^}]+)\}", text):
            for r in m.group(1).split(","):
                refs.add(r.strip())
        for i, line in enumerate(text.splitlines(), 1):
            if PLACEHOLDER_RE.search(line):
                placeholders.append(f"{p.name}:{i}")
            for ch in forbid_chars:
                token = {"—": ["—", "---"], "–": ["–", "--"]}.get(ch, [ch])
                body = re.sub(r"\\(url|href|label|ref|cite\w*|sked|input|include)\{[^}]*\}", "", line)
                body = re.sub(r"\$[^$]*\$", "", body)
                if any(t in body for t in token):
                    forbidden.append(f"{p.name}:{i} '{ch}'")
    float_prefixes = ("fig:", "tab:", "alg:", "lst:")
    unref = sorted(l for l in labels if l.startswith(float_prefixes) and l not in refs)
    undefined = sorted(r for r in refs if r and r not in labels)
    return {"unreferenced_floats": unref, "refs_to_missing_labels": undefined,
            "placeholders": placeholders, "forbidden_chars": forbidden}


def quality(sess, report_dir):
    rd = Path(report_dir)
    qd = sess.dir / "quality"
    qd.mkdir(exist_ok=True)
    p = {**DEFAULT_PARAMS, **sess.data.get("params", {})}
    w = {**DEFAULT_PARAMS["weights"], **p.get("weights", {})}
    tol = float(p.get("overfull_tolerance_pt", 1.0))
    cov = coverage(sess, report_dir=rd)
    summary_path = rd / "build" / "build-summary.json"
    build = json.loads(summary_path.read_text(encoding="utf-8")) if summary_path.exists() else None
    forbid = dig(sess.data, "context.house_style.forbid_chars", FORBIDDEN_DEFAULT) or []
    static = static_tex_checks(rd, forbid)
    entries = fold(sess.events())

    auto = []

    def check(name, ok, detail=""):
        auto.append({"item": name, "pass": bool(ok), "note": detail, "kind": "auto"})

    if build is None:
        check("build summary present", False, "run build.py first")
    else:
        check("compiled without LaTeX errors", build.get("ok") and not build.get("errors"),
              "; ".join(build.get("errors", [])[:3]))
        check("no undefined references", not build.get("undefined_references"),
              ", ".join(build.get("undefined_references", [])[:8]))
        check("no undefined citations", not build.get("undefined_citations"),
              ", ".join(build.get("undefined_citations", [])[:8]))
        big = [o for o in build.get("overfull", []) if o.get("pt", 0) > tol]
        check(f"no overfull boxes above {tol}pt", not big,
              "; ".join(f"{o['pt']}pt {o.get('where', '')}" for o in big[:5]))
        check("no missing glyphs", not build.get("missing_glyphs"),
              "; ".join(build.get("missing_glyphs", [])[:5]))
        hy = build.get("hyphenation", {})
        check("hyphenation patterns loaded for document language", hy.get("ok", True), hy.get("note", ""))
        check("all fonts embedded", build.get("fonts_embedded", True),
              ", ".join(build.get("fonts_not_embedded", [])))
        bib = build.get("bibliography") or {}
        check("every cited key exists in refs.bib", not bib.get("missing_keys"),
              ", ".join(bib.get("missing_keys", [])))
        check("no uncited entries in refs.bib", not bib.get("uncited"),
              ", ".join(bib.get("uncited", [])))
        check("bibliography entries complete for their type", not bib.get("incomplete"),
              "; ".join(bib.get("incomplete", [])[:5]))
    used_src = [k for k in cov["used_sources"] if k in entries and entries[k]["type"] == "source"]
    main_tex = rd / "main.tex"
    if main_tex.exists():
        sys.path.insert(0, str(Path(__file__).resolve().parent))
        import bibfmt
        cited, _ = bibfmt.cited_keys(main_tex)
        by_key = {e.get("bibkey"): k for k, e in entries.items() if e["type"] == "source" and e.get("bibkey")}
        used_src = sorted(set(used_src) | {by_key[c] for c in cited if c in by_key}, key=id_sort_key)
        not_in_ledger = [c for c in cited if c not in by_key]
        check("every cited reference is a source entry in the ledger", not not_in_ledger, ", ".join(not_in_ledger))
    unver = [k for k in used_src if entries[k].get("verified") != "source"]
    check("every source used in the document is verified", not unver, ", ".join(unver))
    check("every float (fig/tab/alg/lst) is referenced in the text", not static["unreferenced_floats"],
          ", ".join(static["unreferenced_floats"]))
    check("no references to missing labels", not static["refs_to_missing_labels"],
          ", ".join(static["refs_to_missing_labels"]))
    check("no placeholders or TODO markers", not static["placeholders"], ", ".join(static["placeholders"][:8]))
    if forbid:
        check("house style: forbidden characters absent", not static["forbidden_chars"],
              ", ".join(static["forbidden_chars"][:8]))
    check("no retracted, contested or unconfirmed entries used", not cov["non_agreed_ids_used"],
          ", ".join(cov["non_agreed_ids_used"]))

    judged_path = qd / "fc-judged.json"
    judged = json.loads(judged_path.read_text(encoding="utf-8")) if judged_path.exists() else []
    for j in judged:
        j["kind"] = "judged"
    fc_items = auto + judged
    fc = sum(1 for i in fc_items if i["pass"]) / len(fc_items) if fc_items else 0.0

    coh_path = qd / "coherence.json"
    coh_data = json.loads(coh_path.read_text(encoding="utf-8")) if coh_path.exists() else None
    if coh_data is None:
        coh, coh_issues, coh_note = 0.0, [], "coherence.json missing: run the coherence review"
    else:
        coh_issues = coh_data.get("issues", [])
        sev = {"critical": 0.15, "major": 0.07, "minor": 0.02}
        computed = max(0.0, 1.0 - sum(sev.get(i.get("severity", "minor"), 0.02) for i in coh_issues))
        coh = float(coh_data.get("score", computed))
        coh_note = coh_data.get("reviewer", "")

    q = w["alpha"] * cov["Cq"] + w["beta"] * coh + w["gamma"] * fc
    blockers = []
    if build is None or not build.get("ok") or build.get("errors"):
        blockers.append("document does not compile cleanly")
    if cov["uncovered_high"]:
        blockers.append("high-priority K* entries missing from the document: " + ", ".join(cov["uncovered_high"]))
    if cov["model_claims_with_figures_not_source_verified"]:
        blockers.append("model-origin claims with figures lack a verified source: "
                        + ", ".join(cov["model_claims_with_figures_not_source_verified"]))
    crit = [i for i in coh_issues if i.get("severity") == "critical"]
    if crit:
        blockers.append(f"{len(crit)} critical coherence issue(s)")
    if coh_data is None:
        blockers.append("coherence review not done")
    if build and (build.get("bibliography") or {}).get("missing_keys"):
        blockers.append("citations to keys missing from refs.bib")
    passed = q >= float(p["q_threshold"]) and not blockers

    result = {
        "Q": round(q, 4), "Cq": cov["Cq"], "Coh": round(coh, 4), "Fc": round(fc, 4),
        "weights": w, "threshold": p["q_threshold"], "passed": passed, "blockers": blockers,
        "coverage": cov, "fc_items": fc_items, "coherence_issues": coh_issues,
        "coherence_reviewer": coh_note, "evaluated": now(),
    }
    (qd / "quality.json").write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")

    md = [f"# Quality gate Q(R)", "",
          f"Q = {w['alpha']}·Cq + {w['beta']}·Coh + {w['gamma']}·Fc = "
          f"{w['alpha']}·{cov['Cq']:.2f} + {w['beta']}·{coh:.2f} + {w['gamma']}·{fc:.2f} = **{q:.3f}** "
          f"(threshold {p['q_threshold']}) → **{'PASS' if passed else 'FAIL'}**", ""]
    if blockers:
        md += ["## Blockers", ""] + [f"- {b}" for b in blockers] + [""]
    md += ["## Completeness Cq", "",
           f"{cov['covered_entries']}/{cov['target_entries']} K* entries tagged in the document (priority-weighted {cov['Cq']:.2f}).", ""]
    if cov["uncovered"]:
        md.append("Uncovered: " + ", ".join(cov["uncovered"]))
        md.append("")
    md += ["## Coherence Coh", ""]
    if coh_issues:
        md += [f"- [{i.get('severity')}] {i.get('where', '')}: {i.get('text', '')}" for i in coh_issues]
    else:
        md.append("- no issues recorded" if coh_data is not None else "- review missing")
    md += ["", "## Formal compliance Fc", ""]
    md += [f"- [{'x' if i['pass'] else ' '}] ({i['kind']}) {i['item']}" + (f" ({i['note']})" if i.get('note') and not i['pass'] else "")
           for i in fc_items]
    (qd / "quality.md").write_text("\n".join(md) + "\n", encoding="utf-8")
    return result


# ----------------------------------------------------------------- commands

def cmd_init(a):
    root = Path(a.root)
    slug = a.slug or slugify(a.topic)
    d = root / slug
    if (d / "session.json").exists():
        die(f"session already exists: {d}")
    d.mkdir(parents=True, exist_ok=True)
    if a.profile not in PROFILES:
        die(f"profile must be one of {PROFILES}")
    data = {
        "sked_version": VERSION,
        "id": slug,
        "topic": a.topic,
        "created": now(),
        "updated": now(),
        "phase": 1,
        "round": 0,
        "mode": a.mode,
        "profile": a.profile,
        "language": {"dialogue": a.lang_dialogue, "document": a.lang_doc},
        "params": json.loads(json.dumps(DEFAULT_PARAMS)),
        "context": {
            "authority": "", "audience": "", "exemplars": [], "constraints": [],
            "rubric": [], "house_style": {"rules": [], "forbid_chars": []},
            "metadata": {"title": a.topic, "author": "", "affiliation": "",
                         "doc_type": "", "version": "1.0.0", "date": "", "keywords": ""},
        },
        "metrics": [],
        "gates": {},
        "converged": None,
    }
    (d / "session.json").write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    (d / "ledger.jsonl").touch()
    (d / "dialogue.jsonl").touch()
    print(json.dumps({"session": str(d.resolve()), "id": slug}, ensure_ascii=False))


def cmd_list(a):
    root = Path(a.root)
    rows = []
    for sj in sorted(root.glob("*/session.json")):
        d = json.loads(sj.read_text(encoding="utf-8"))
        rows.append({"session": str(sj.parent.resolve()), "topic": d.get("topic"),
                     "phase": d.get("phase"), "round": d.get("round"), "updated": d.get("updated")})
    print(json.dumps(rows, ensure_ascii=False, indent=2))


def cmd_set(a):
    s = find_session(a.session)
    try:
        val = json.loads(a.value)
    except json.JSONDecodeError:
        val = a.value
    cur = s.data
    parts = a.key.split(".")
    for part in parts[:-1]:
        cur = cur.setdefault(part, {})
    cur[parts[-1]] = val
    if a.key == "profile" and val not in PROFILES:
        die(f"profile must be one of {PROFILES}")
    s.save()
    print(json.dumps({a.key: val}, ensure_ascii=False))


def cmd_apply(a):
    s = find_session(a.session)
    raw = sys.stdin.read() if a.file == "-" else Path(a.file).read_text(encoding="utf-8")
    ops = json.loads(raw)
    if isinstance(ops, dict):
        ops = [ops]
    assigned, evs, turns = apply_ops(s, ops)
    entries = fold(s.events(), include_retracted=True)
    lines = []
    for ev in evs:
        e = entries.get(ev["id"], {})
        if ev["op"] == "add":
            lines.append(f"+ {fmt_entry(ev['id'], e)}")
        else:
            lines.append(f"~ {ev['id']} {ev['op']} → {fmt_entry(ev['id'], e)}")
    print(f"round {s.round}: {len(evs)} ledger event(s), {len(turns)} turn(s) recorded")
    print("\n".join(lines))
    if assigned:
        print("assigned ids: " + ", ".join(assigned))


def cmd_round_close(a):
    s = find_session(a.session)
    rnd = s.round
    st = round_stats(s, rnd)
    if a.note:
        st["note"] = a.note
    metrics = [m for m in s.data.get("metrics", []) if m["round"] != rnd]
    metrics.append(st)
    s.data["metrics"] = metrics
    s.data["round"] = rnd + 1
    s.save()
    conv = convergence(s)
    decided, unchanged = m_acceptance(s.events())
    warn = ""
    if decided >= 5 and unchanged / decided > 0.8:
        warn = (f" WARNING: {unchanged}/{decided} model proposals accepted unchanged; "
                "ask more open questions so the human's knowledge, not the model's frame, drives K*.")
    print(f"round {rnd} closed: delta={st['delta']:.3f} active={st['active']} +{st['added']} "
          f"~{st['edited'] + st['status_changes']} -{st['retracted']} open_q={st['open_questions']} "
          f"contested={st['contested']} | converged={conv['converged']}"
          + (" | BUDGET REACHED: ask the human whether to continue" if conv["budget_reached"] else "") + warn)
    if a.json:
        print(json.dumps({"stats": st, "convergence": conv}, ensure_ascii=False, indent=2))
    elif conv["reasons"] and rnd >= 1:
        print("not converged because: " + "; ".join(conv["reasons"]))


def cmd_show(a):
    s = find_session(a.session)
    entries = fold(s.events(), upto_round=a.round, include_retracted=a.all)
    if a.type:
        entries = {k: v for k, v in entries.items() if v["type"] in a.type.split(",")}
    if a.status:
        entries = {k: v for k, v in entries.items() if v["status"] in a.status.split(",")}
    if a.origin:
        entries = {k: v for k, v in entries.items() if v.get("origin") in a.origin.split(",")}
    if a.id:
        entries = {k: v for k, v in entries.items() if k in a.id.split(",")}
    if a.format == "json":
        print(json.dumps(entries, ensure_ascii=False, indent=2))
    else:
        print(entries_md(entries) or "(no entries)")


def cmd_dialogue(a):
    s = find_session(a.session)
    turns = s.turns()[-a.last:] if a.last else s.turns()
    if a.format == "json":
        print(json.dumps(turns, ensure_ascii=False, indent=2))
        return
    for t in turns:
        print(f"## round {t['round']} ({t.get('move', '-')})")
        for k, label in (("q_M", "M asks"), ("a_H", "H answers"), ("q_H", "H asks"), ("a_M", "M answers"), ("summary", "summary")):
            if t.get(k):
                print(f"- {label}: {t[k]}")
        print()


def cmd_status(a):
    s = find_session(a.session)
    rep = status_report(s)
    if a.json:
        print(json.dumps(rep, ensure_ascii=False, indent=2))
        return
    conv = rep["convergence"]
    print(f"SKED session {s.dir.name}: \"{rep['topic']}\"")
    print(f"phase {rep['phase']} | next round {rep['round']} | profile {rep['profile']} | "
          f"lang {rep['language']} | mode {rep['mode']}")
    print(f"active entries {rep['active_total']}: " + "; ".join(
        f"{t} " + ",".join(f"{st}={n}" for st, n in sts.items()) for t, sts in sorted(rep["entries"].items())))
    print("last deltas: " + (", ".join(f"{d:.3f}" for d in rep["last_deltas"]) or "none"))
    print(f"converged: {conv['converged']}" + (f" (recorded: {rep['converged']['by']} at round {rep['converged']['round']})" if rep["converged"] else ""))
    if conv["reasons"]:
        print("  pending: " + "; ".join(conv["reasons"]))
    if conv["pending_model_proposals"]:
        print("  model proposals awaiting the human: " + ", ".join(conv["pending_model_proposals"]))
    print(f"model proposals decided {rep['model_proposals_decided']}, accepted unchanged {rep['model_proposals_accepted_unchanged']}")
    for g, v in rep["gates"].items():
        print(f"gate {g}: confirmed {v.get('ts')} (round {v.get('round')})")
    print("next: " + rep["next"])


def cmd_converge(a):
    s = find_session(a.session)
    conv = convergence(s)
    if a.by == "delta" and not conv["converged"] and not a.force:
        die("criteria not met: " + "; ".join(conv["reasons"]))
    s.data["converged"] = {"by": a.by, "round": s.round - 1, "ts": now(),
                           "open_reasons_at_convergence": conv["reasons"], "note": a.note or ""}
    s.save()
    print(json.dumps(s.data["converged"], ensure_ascii=False, indent=2))


def gate_ok(s, name, file):
    g = s.data.get("gates", {}).get(name)
    if not g:
        return False, f"{name} not confirmed"
    if not file.exists():
        return False, f"{file.name} missing"
    if sha256_file(file) != g.get("hash"):
        return False, f"{file.name} changed after confirmation; confirm again"
    return True, ""


def cmd_phase(a):
    s = find_session(a.session)
    target = a.phase if a.phase == "done" else int(a.phase)
    problems = []
    if not a.force:
        if target in (2, 3, 4, 5, "done") and not any(m["round"] == 0 for m in s.data.get("metrics", [])):
            problems.append("round 0 (initial frame K(0)) not closed")
        if target in (3, 4, 5, "done") and not s.data.get("converged"):
            problems.append("dialogue not converged (use `converge`)")
        if target in (4, 5, "done"):
            ok, why = gate_ok(s, "kstar", s.dir / "kstar.md")
            if not ok:
                problems.append(why)
        if target in (5, "done"):
            ok, why = gate_ok(s, "structure", s.dir / "structure.md")
            if not ok:
                problems.append(why)
        if target == "done":
            qj = s.dir / "quality" / "quality.json"
            if not qj.exists() or not json.loads(qj.read_text(encoding="utf-8")).get("passed"):
                problems.append("quality gate not passed")
    if problems:
        die("cannot move to phase " + str(target) + ": " + "; ".join(problems) + " (or --force)")
    s.data["phase"] = target
    s.save()
    print(f"phase set to {target}")


def cmd_kstar(a):
    s = find_session(a.session)
    out = Path(a.out) if a.out else s.dir / "kstar.md"
    n_agreed, n_open, n_non = build_kstar(s, out)
    print(f"wrote {out}: {n_agreed} agreed entries, {n_open} open/deferred questions, "
          f"{n_non} entries still proposed/contested")
    if n_non:
        print("resolve proposed/contested entries (agree, edit, or retract) before `confirm kstar`")


def cmd_confirm(a):
    s = find_session(a.session)
    file = s.dir / ("kstar.md" if a.what == "kstar" else "structure.md")
    if not file.exists():
        die(f"{file.name} does not exist")
    if a.what == "kstar":
        non = {k: v for k, v in fold(s.events()).items()
               if v["status"] in ("proposed", "contested") and v["type"] not in ("question", "source")}
        if non and not a.force:
            die("entries still proposed/contested: " + ", ".join(sorted(non, key=id_sort_key)))
        if L10N[s.doc_lang]["narrative_todo"] in file.read_text(encoding="utf-8") and not a.force:
            die("kstar.md narrative block is still the placeholder; write the synthesis first")
    s.data.setdefault("gates", {})[a.what] = {"hash": sha256_file(file), "ts": now(), "round": s.round}
    s.save()
    print(f"{a.what} confirmed (sha256 {s.data['gates'][a.what]['hash'][:12]})")


def cmd_coverage(a):
    s = find_session(a.session)
    if a.plan:
        res = coverage(s, plan=Path(a.plan))
    else:
        res = coverage(s, report_dir=Path(a.report or (s.dir / "report")))
    if a.json:
        print(json.dumps(res, ensure_ascii=False, indent=2))
        return
    print(f"Cq={res['Cq']:.3f} ({res['covered_entries']}/{res['target_entries']} K* entries, mode {res['mode']})")
    for key in ("uncovered_high", "uncovered", "unknown_ids", "non_agreed_ids_used",
                "model_claims_with_figures_not_source_verified", "model_claims_not_source_verified"):
        if res[key]:
            print(f"{key}: {', '.join(res[key])}")


def cmd_scaffold(a):
    s = find_session(a.session)
    if a.profile:
        s.data["profile"] = a.profile
        s.save()
    rd, created, n, missing = scaffold(s, force=a.force)
    print(f"report dir {rd}: main.tex {'created' if created else 'kept (use --force to overwrite)'}; "
          f"skedreport.cls copied; refs.bib with {n} entr{'y' if n == 1 else 'ies'}")
    if missing:
        print("sources without a `bib` field (add BibTeX with an edit op): " + ", ".join(missing))


def cmd_bib(a):
    s = find_session(a.session)
    rd = s.dir / "report"
    rd.mkdir(exist_ok=True)
    n, missing = write_bib(s, rd)
    print(f"refs.bib rewritten with {n} entries")
    if missing:
        print("sources without a `bib` field: " + ", ".join(missing))


def cmd_quality(a):
    s = find_session(a.session)
    res = quality(s, Path(a.report or (s.dir / "report")))
    print(f"Q={res['Q']:.3f} (Cq={res['Cq']:.2f}, Coh={res['Coh']:.2f}, Fc={res['Fc']:.2f}; "
          f"threshold {res['threshold']}) → {'PASS' if res['passed'] else 'FAIL'}")
    for b in res["blockers"]:
        print("BLOCKER: " + b)
    failed = [i for i in res["fc_items"] if not i["pass"]]
    for i in failed:
        print(f"Fc fail ({i['kind']}): {i['item']}" + (f" ({i['note']})" if i.get("note") else ""))
    print(f"report: {s.dir / 'quality' / 'quality.md'}")


def main():
    ap = argparse.ArgumentParser(prog="sked.py", description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--session", help="session directory (default: $SKED_SESSION, cwd, or the only one in ./sked-sessions)")
    sub = ap.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("init", help="create a new session (phase 1)")
    p.add_argument("--topic", required=True)
    p.add_argument("--root", default=DEFAULT_ROOT)
    p.add_argument("--slug")
    p.add_argument("--lang-dialogue", default="uk")
    p.add_argument("--lang-doc", default="uk")
    p.add_argument("--profile", default="ieee", choices=PROFILES)
    p.add_argument("--mode", default="deep", choices=["deep", "brisk"])
    p.set_defaults(fn=cmd_init)

    p = sub.add_parser("list", help="list sessions under a root folder")
    p.add_argument("--root", default=DEFAULT_ROOT)
    p.set_defaults(fn=cmd_list)

    p = sub.add_parser("set", help="set a session.json value by dot path (value parsed as JSON if possible)")
    p.add_argument("key")
    p.add_argument("value")
    p.set_defaults(fn=cmd_set)

    p = sub.add_parser("apply", help="apply a JSON array of ledger ops (file path or - for stdin)")
    p.add_argument("file")
    p.set_defaults(fn=cmd_apply)

    p = sub.add_parser("round-close", help="close the current round: delta, metrics, convergence")
    p.add_argument("--note")
    p.add_argument("--json", action="store_true")
    p.set_defaults(fn=cmd_round_close)

    p = sub.add_parser("show", help="show ledger entries")
    p.add_argument("--type")
    p.add_argument("--status")
    p.add_argument("--origin")
    p.add_argument("--id")
    p.add_argument("--round", type=int)
    p.add_argument("--all", action="store_true", help="include retracted")
    p.add_argument("--format", choices=["md", "json"], default="md")
    p.set_defaults(fn=cmd_show)

    p = sub.add_parser("dialogue", help="show the dialogue log")
    p.add_argument("--last", type=int)
    p.add_argument("--format", choices=["md", "json"], default="md")
    p.set_defaults(fn=cmd_dialogue)

    p = sub.add_parser("status", help="session dashboard")
    p.add_argument("--json", action="store_true")
    p.set_defaults(fn=cmd_status)

    p = sub.add_parser("converge", help="record convergence (by delta criteria, human decision, or budget)")
    p.add_argument("--by", choices=["delta", "human", "budget"], required=True)
    p.add_argument("--note")
    p.add_argument("--force", action="store_true")
    p.set_defaults(fn=cmd_converge)

    p = sub.add_parser("phase", help="move to a phase (1-5 or done) with gate checks")
    p.add_argument("phase", choices=["1", "2", "3", "4", "5", "done"])
    p.add_argument("--force", action="store_true")
    p.set_defaults(fn=cmd_phase)

    p = sub.add_parser("kstar", help="export K* (agreed knowledge) to kstar.md, keeping the narrative block")
    p.add_argument("--out")
    p.set_defaults(fn=cmd_kstar)

    p = sub.add_parser("confirm", help="record human confirmation of kstar.md or structure.md (hash-frozen)")
    p.add_argument("what", choices=["kstar", "structure"])
    p.add_argument("--force", action="store_true")
    p.set_defaults(fn=cmd_confirm)

    p = sub.add_parser("coverage", help="coverage of K* in structure.md (--plan) or in the LaTeX sources")
    p.add_argument("--plan")
    p.add_argument("--report")
    p.add_argument("--json", action="store_true")
    p.set_defaults(fn=cmd_coverage)

    p = sub.add_parser("scaffold", help="create report/ with main.tex, class and refs.bib")
    p.add_argument("--profile", choices=PROFILES)
    p.add_argument("--force", action="store_true")
    p.set_defaults(fn=cmd_scaffold)

    p = sub.add_parser("bib", help="rewrite report/refs.bib from source entries")
    p.set_defaults(fn=cmd_bib)

    p = sub.add_parser("quality", help="compute Q(R) from coverage, build summary, judged Fc items and coherence review")
    p.add_argument("--report")
    p.set_defaults(fn=cmd_quality)

    a = ap.parse_args()
    a.fn(a)


if __name__ == "__main__":
    main()
