#!/usr/bin/env python3
"""Build a SKED report: dependencies, bibliography, XeLaTeX runs, log analysis,
page previews and a machine-readable build summary.

Usage:
  python3 build.py --dir REPORT_DIR [--main main.tex] [--ensure-deps] [--review]
                   [--no-previews] [--dpi 60] [--max-runs 4]

Output (inside REPORT_DIR):
  main.pdf                       final PDF (copied from build/)
  build/main.log                 LaTeX log
  build/build-summary.json       errors, warnings, overfull boxes, glyphs, fonts, bibliography
  build/preview/page-NN.png      page renders, plus contact-sheet-N.png thumbnails
  build/main-review.pdf          with --review: K* ledger tags shown in the margin
Exit code 0 when a PDF was produced without LaTeX errors.
"""
import argparse
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import bibfmt  # noqa: E402

REQUIRED_FILES = [
    "extarticle.cls", "fontspec.sty", "babel.sty", "kvoptions.sty", "etoolbox.sty", "iftex.sty",
    "amsmath.sty", "xcolor.sty", "graphicx.sty", "booktabs.sty", "tabularx.sty", "multirow.sty",
    "makecell.sty", "longtable.sty", "enumitem.sty", "setspace.sty", "float.sty", "lastpage.sty",
    "totcount.sty", "tikz.sty", "algorithm.sty", "algpseudocode.sty", "listings.sty", "microtype.sty",
    "caption.sty", "titlesec.sty", "tocloft.sty", "fancyhdr.sty", "chngcntr.sty", "csquotes.sty",
    "geometry.sty", "indentfirst.sty", "xurl.sty", "hyperref.sty", "natbib.sty",
]
APT_TEX = ["texlive-xetex", "texlive-latex-recommended", "texlive-latex-extra",
           "texlive-fonts-recommended", "texlive-pictures", "texlive-science"]
LANG_PKG = {"ukrainian": "texlive-lang-cyrillic", "russian": "texlive-lang-cyrillic",
            "polish": "texlive-lang-polish", "german": "texlive-lang-german"}
BABEL = {"uk": "ukrainian", "en": "english", "ru": "russian", "pl": "polish", "de": "german"}


def run(cmd, cwd=None, timeout=600, env=None):
    try:
        p = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, timeout=timeout, env=env,
                           errors="replace")
        return p.returncode, p.stdout + p.stderr
    except FileNotFoundError:
        return 127, f"{cmd[0]}: not found"
    except subprocess.TimeoutExpired:
        return 124, f"{cmd[0]}: timeout after {timeout}s"


def can_apt():
    return shutil.which("apt-get") is not None and hasattr(os, "geteuid") and os.geteuid() == 0


def apt_install(pkgs, log):
    if not can_apt():
        log.append(f"cannot install {pkgs}: apt-get unavailable or not root")
        return False
    code, out = run(["apt-get", "install", "-y", "--no-install-recommends", *pkgs], timeout=1500,
                    env={**os.environ, "DEBIAN_FRONTEND": "noninteractive"})
    if code != 0:
        run(["apt-get", "update"], timeout=600)
        code, out = run(["apt-get", "install", "-y", "--no-install-recommends", *pkgs], timeout=1500,
                        env={**os.environ, "DEBIAN_FRONTEND": "noninteractive"})
    log.append(f"apt-get install {' '.join(pkgs)}: {'ok' if code == 0 else 'FAILED'}")
    return code == 0


def class_options(main_tex):
    text = re.sub(r"(?<!\\)%.*", "", main_tex.read_text(encoding="utf-8", errors="replace"))
    m = re.search(r"\\documentclass\s*\[([^\]]*)\]\s*\{skedreport\}", text)
    opts = {"profile": "ieee", "lang": "uk"}
    if m:
        for part in m.group(1).split(","):
            if "=" in part:
                k, v = [x.strip() for x in part.split("=", 1)]
                opts[k] = v
    return opts


def probe_hyphenation(babel_name, workdir):
    """Return (ok, note): whether XeLaTeX has hyphenation patterns for the language."""
    if babel_name == "english":
        return True, "english patterns are always present"
    probe = workdir / "hyphprobe.tex"
    probe.write_text("\\documentclass{article}\\usepackage[provide=*]{babel}"
                     f"\\babelprovide[import,main]{{{babel_name}}}"
                     "\\begin{document}x\\end{document}\n", encoding="utf-8")
    run(["xelatex", "-interaction=nonstopmode", "-halt-on-error", probe.name], cwd=workdir, timeout=180)
    log = (workdir / "hyphprobe.log")
    text = log.read_text(encoding="utf-8", errors="replace") if log.exists() else ""
    for ext in (".tex", ".log", ".aux", ".pdf"):
        (workdir / f"hyphprobe{ext}").unlink(missing_ok=True)
    if re.search(r"Hyphen rules for '" + babel_name + r"' set to \\l@nil", text) or \
            re.search(r"No hyphenation patterns were preloaded for\s+the language '" + babel_name, text):
        return False, f"no hyphenation patterns for {babel_name} in this TeX installation"
    return True, f"{babel_name} hyphenation patterns loaded"


def ensure_deps(report_dir, babel_name, log):
    build = report_dir / "build"
    build.mkdir(exist_ok=True)
    if not shutil.which("xelatex"):
        apt_install(APT_TEX, log)
    missing = [f for f in REQUIRED_FILES if not run(["kpsewhich", f])[1].strip()]
    if missing:
        log.append("missing TeX files: " + ", ".join(missing))
        apt_install(APT_TEX, log)
        missing = [f for f in REQUIRED_FILES if not run(["kpsewhich", f])[1].strip()]
    ok, note = probe_hyphenation(babel_name, build)
    if not ok and babel_name in LANG_PKG:
        log.append(note + "; trying to install " + LANG_PKG[babel_name])
        if apt_install([LANG_PKG[babel_name]], log):
            ok, note = probe_hyphenation(babel_name, build)
    code, fonts = run(["fc-list", ":lang=uk", "family"]) if babel_name in ("ukrainian", "russian") else (0, "x")
    if code == 0 and not fonts.strip():
        log.append("no Cyrillic fonts found; installing fonts-liberation fonts-dejavu-core")
        apt_install(["fonts-liberation", "fonts-dejavu-core"], log)
    return {"missing_tex_files": missing, "hyphenation_ok": ok, "hyphenation_note": note}


# ----------------------------------------------------------------- log analysis

def analyze_log(log_path, report_dir):
    text = log_path.read_text(encoding="utf-8", errors="replace") if log_path.exists() else ""
    res = {"errors": [], "undefined_references": [], "undefined_citations": [], "overfull": [],
           "underfull_count": 0, "missing_glyphs": [], "font_warnings": [], "rerun": False,
           "hyphenation": {"ok": True, "note": ""}, "class_warnings": []}
    lines = text.splitlines()
    for i, line in enumerate(lines):
        m = re.match(r"^(?:\./)?([^:\s]+\.tex):(\d+): (.*)$", line)
        if m:
            res["errors"].append(f"{m.group(1)}:{m.group(2)}: {m.group(3)}")
            continue
        if line.startswith("! "):
            ctx = next((l for l in lines[i + 1:i + 8] if l.startswith("l.")), "")
            msg = f"{line[2:]} {ctx}".strip()
            if not any(msg.split(" l.")[0] in e for e in res["errors"]):
                res["errors"].append(msg)
    for m in re.finditer(r"Reference `([^']+)' on page \d+ undefined", text):
        if m.group(1) not in res["undefined_references"]:
            res["undefined_references"].append(m.group(1))
    for m in re.finditer(r"Citation `([^']+)' on page \d+ undefined|Citation `([^']+)' undefined", text):
        k = m.group(1) or m.group(2)
        if k not in res["undefined_citations"]:
            res["undefined_citations"].append(k)
    for m in re.finditer(r"Overfull \\hbox \(([\d.]+)pt too wide\) (?:in paragraph |in alignment |detected )?at lines? (\d+)(?:--(\d+))?", text):
        before = text[:m.start()]
        files = re.findall(r"\((\./[^\s()]+?\.tex)", before)
        where = f"{files[-1][2:] if files else '?'}:{m.group(2)}"
        res["overfull"].append({"pt": float(m.group(1)), "where": where})
    res["underfull_count"] = len(re.findall(r"Underfull \\hbox", text))
    for m in re.finditer(r"Missing character: There is no (.+?) in font ([^!]+)!", text):
        item = f"{m.group(1)} in {m.group(2).strip()}"
        if item not in res["missing_glyphs"]:
            res["missing_glyphs"].append(item)
    for m in re.finditer(r"Font shape `([^']+)' undefined", text):
        if m.group(1) not in res["font_warnings"]:
            res["font_warnings"].append(m.group(1))
    for m in re.finditer(r"Hyphen rules for '(\w+)' set to \\l@nil", text):
        res["hyphenation"] = {"ok": False, "note": f"no hyphenation patterns for {m.group(1)}: text relies on \\emergencystretch; install texlive-lang-cyrillic (or the language package) for proper justification"}
    for m in re.finditer(r"(?:Class|Package) skedreport Warning: (.+)", text):
        res["class_warnings"].append(m.group(1).strip())
    for m in re.finditer(r"skedreport warning: (.+)", text, re.I):
        res["class_warnings"].append(m.group(1).strip())
    res["rerun"] = bool(re.search(r"Rerun to get|Label\(s\) may have changed|rerun LaTeX|Temporary extra page", text))
    return res


def pdf_checks(pdf):
    out = {"pages": None, "fonts_embedded": True, "fonts_not_embedded": []}
    code, info = run(["pdfinfo", str(pdf)])
    m = re.search(r"^Pages:\s+(\d+)", info, re.M)
    if m:
        out["pages"] = int(m.group(1))
    code, fonts = run(["pdffonts", str(pdf)])
    lines = fonts.splitlines()
    if code == 0 and len(lines) >= 2 and set(lines[1].strip()) <= {"-", " "}:
        spans = [(m.start(), m.end()) for m in re.finditer(r"-+", lines[1])]
        for line in lines[2:]:
            cols = [line[s:e + 1].strip() for s, e in spans]
            if len(cols) >= 4 and cols[3] == "no":
                out["fonts_embedded"] = False
                out["fonts_not_embedded"].append(cols[0])
    return out


def previews(pdf, outdir, dpi):
    outdir.mkdir(parents=True, exist_ok=True)
    for old in outdir.glob("*.png"):
        old.unlink()
    code, _ = run(["pdftoppm", "-r", str(dpi), "-png", str(pdf), str(outdir / "page")])
    pages = sorted(outdir.glob("page-*.png"))
    sheets = []
    try:
        from PIL import Image, ImageDraw
        per_sheet, cols = 12, 4
        for s in range(0, len(pages), per_sheet):
            chunk = pages[s:s + per_sheet]
            ims = [Image.open(p).convert("RGB") for p in chunk]
            w = 300
            thumbs = [im.resize((w, int(im.height * w / im.width))) for im in ims]
            h = max(t.height for t in thumbs)
            rows = (len(thumbs) + cols - 1) // cols
            sheet = Image.new("RGB", (cols * (w + 16) + 16, rows * (h + 34) + 16), "#d9d9d9")
            d = ImageDraw.Draw(sheet)
            for k, t in enumerate(thumbs):
                x = 16 + (k % cols) * (w + 16)
                y = 16 + (k // cols) * (h + 34)
                sheet.paste(t, (x, y + 18))
                d.text((x, y + 2), f"p. {s + k + 1}", fill="#000000")
            path = outdir / f"contact-sheet-{s // per_sheet + 1}.png"
            sheet.save(path)
            sheets.append(str(path))
    except Exception as e:  # PIL missing or image error: individual pages still exist
        sheets.append(f"contact sheet skipped: {e}")
    return [str(p) for p in pages], sheets


# ----------------------------------------------------------------- main

def compile_tex(report_dir, main_name, jobname, max_runs, pre=""):
    build = report_dir / "build"
    build.mkdir(exist_ok=True)
    env = {**os.environ, "max_print_line": "10000", "error_line": "254", "half_error_line": "238"}
    src = main_name
    if pre:
        src_path = report_dir / f".{jobname}.tex"
        src_path.write_text(pre + "\\input{" + main_name + "}\n", encoding="utf-8")
        src = src_path.name
    runs, analysis = 0, {}
    for runs in range(1, max_runs + 1):
        code, _ = run(["xelatex", "-interaction=nonstopmode", "-file-line-error", f"-jobname={jobname}",
                       f"-output-directory=build", src], cwd=report_dir, timeout=900, env=env)
        analysis = analyze_log(build / f"{jobname}.log", report_dir)
        if analysis["errors"] and runs >= 1 and not (build / f"{jobname}.pdf").exists():
            break
        if runs >= 2 and not analysis["rerun"]:
            break
    if pre:
        (report_dir / f".{jobname}.tex").unlink(missing_ok=True)
    return runs, analysis


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--dir", required=True, help="report directory containing main.tex")
    ap.add_argument("--main", default="main.tex")
    ap.add_argument("--ensure-deps", action="store_true", help="check/install TeX packages, hyphenation, fonts")
    ap.add_argument("--review", action="store_true", help="also build main-review.pdf with ledger tags")
    ap.add_argument("--no-previews", action="store_true")
    ap.add_argument("--dpi", type=int, default=60)
    ap.add_argument("--max-runs", type=int, default=4)
    ap.add_argument("--bib-order", choices=["cite", "alpha"])
    ap.add_argument("--update-class", action="store_true", help="replace the report's skedreport.cls with the plugin copy")
    a = ap.parse_args()

    rd = Path(a.dir).resolve()
    main_tex = rd / a.main
    if not main_tex.exists():
        print(f"ERROR: {main_tex} not found", file=sys.stderr)
        sys.exit(2)
    build = rd / "build"
    build.mkdir(exist_ok=True)
    opts = class_options(main_tex)
    babel_name = BABEL.get(opts.get("lang", "uk"), opts.get("lang", "uk"))
    summary = {"dir": str(rd), "profile": opts.get("profile"), "lang": opts.get("lang"), "setup_log": []}

    if a.ensure_deps:
        summary["deps"] = ensure_deps(rd, babel_name, summary["setup_log"])
    if not shutil.which("xelatex"):
        summary.update({"ok": False, "errors": ["xelatex not installed (apt-get install texlive-xetex texlive-latex-extra ...)"]})
        (build / "build-summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
        print(json.dumps(summary, ensure_ascii=False, indent=2))
        sys.exit(2)
    tpl_cls = HERE.parent / "templates" / "skedreport.cls"
    if not (rd / "skedreport.cls").exists() or a.update_class:
        shutil.copy2(tpl_cls, rd / "skedreport.cls")
        summary["setup_log"].append("copied skedreport.cls from the plugin into the report directory")
    elif (rd / "skedreport.cls").read_bytes() != tpl_cls.read_bytes():
        summary["setup_log"].append("report uses a skedreport.cls that differs from the plugin copy "
                                    "(customized or outdated); pass --update-class to replace it")

    bib = rd / "refs.bib"
    if bib.exists():
        summary["bibliography"] = bibfmt.render(bib, main_tex, opts.get("profile", "ieee"), opts.get("lang", "uk"),
                                                rd / "references.tex", a.bib_order)
    else:
        (rd / "references.tex").write_text("\\setcounter{skedsrc}{0}\n", encoding="utf-8")
        summary["bibliography"] = {"note": "no refs.bib", "missing_keys": [], "uncited": [], "incomplete": []}

    runs, analysis = compile_tex(rd, a.main, "main", a.max_runs)
    summary["runs"] = runs
    summary.update(analysis)
    if summary.get("deps") and not summary["deps"]["hyphenation_ok"]:
        summary["hyphenation"] = {"ok": False, "note": summary["deps"]["hyphenation_note"]}
    pdf = build / "main.pdf"
    summary["pdf"] = None
    if pdf.exists():
        shutil.copy2(pdf, rd / "main.pdf")
        summary["pdf"] = str(rd / "main.pdf")
        summary.update(pdf_checks(pdf))
        if not a.no_previews:
            summary["previews"], summary["contact_sheets"] = previews(pdf, build / "preview", a.dpi)
    summary["ok"] = bool(summary["pdf"]) and not summary["errors"]

    if a.review and summary["ok"]:
        r_runs, r_an = compile_tex(rd, a.main, "main-review", 3, pre="\\PassOptionsToClass{review}{skedreport}\n")
        summary["review_pdf"] = str(build / "main-review.pdf") if (build / "main-review.pdf").exists() else None

    (build / "build-summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    big = [o for o in summary["overfull"] if o["pt"] > 1.0]
    print(f"build {'OK' if summary['ok'] else 'FAILED'}: {summary.get('pages')} pages, runs={runs}, "
          f"errors={len(summary['errors'])}, undefined refs={len(summary['undefined_references'])}, "
          f"undefined cites={len(summary['undefined_citations'])}, overfull>1pt={len(big)}, "
          f"underfull={summary['underfull_count']}, missing glyphs={len(summary['missing_glyphs'])}, "
          f"hyphenation={'ok' if summary['hyphenation']['ok'] else 'MISSING'}, "
          f"fonts embedded={summary.get('fonts_embedded')}")
    for e in summary["errors"][:10]:
        print("  error: " + e)
    for o in big[:10]:
        print(f"  overfull {o['pt']}pt at {o['where']}")
    for g in summary["missing_glyphs"][:10]:
        print("  missing glyph: " + g)
    b = summary.get("bibliography") or {}
    for k in ("missing_keys", "uncited", "incomplete"):
        if b.get(k):
            print(f"  bibliography {k}: {', '.join(b[k][:10])}")
    for line in summary["setup_log"]:
        print("  setup: " + line)
    if summary.get("contact_sheets"):
        print("  previews: " + ", ".join(summary["contact_sheets"]))
    print(f"  summary: {build / 'build-summary.json'}")
    sys.exit(0 if summary["ok"] else 1)


if __name__ == "__main__":
    main()
