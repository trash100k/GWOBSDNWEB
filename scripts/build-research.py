#!/usr/bin/env python3
"""Consolidate every research doc under docs/research/ into one master file."""
import datetime, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "docs/research/RESEARCH.md"

PARTS = [
    ("I · Copy & Persuasion — the system", [
        "docs/research/copy/README.md",
        "docs/research/copy/01-modern-web-copy.md",
        "docs/research/copy/02-copy-frameworks.md",
        "docs/research/copy/03-brand-archetypes.md",
        "docs/research/copy/04-dark-levers.md",
        "docs/research/copy/05-high-ticket.md",
        "docs/research/copy/06-copy-and-design.md",
        "docs/research/copy-architecture-and-dark-persuasion.md",
        "docs/research/copy-deep-dive-advanced.md",
    ]),
    ("II · Pricing & the Sales Journey", [
        "docs/research/2026-pricing-journey-and-design.md",
    ]),
    ("III · Scene · 3D · Visual craft", [
        "docs/research/faceted-obsidian-jewel.md",
        "docs/research/mandala-construction-and-animation.md",
        "docs/research/typography-3d-fontplay.md",
    ]),
    ("IV · Motion & Pacing", [
        "docs/research/pacing-fluidity-snap.md",
        "docs/research/pacing-motion-deep-dive.md",
    ]),
    ("V · Performance & Core Web Vitals", [
        "docs/research/webgl-performance-cwv.md",
    ]),
    ("VI · Lead Capture & Nurture", [
        "docs/research/lead-capture-and-nurture.md",
    ]),
    ("VII · Deploy & Ops", [
        "docs/research/vercel-hobby-deploy-limits.md",
    ]),
    ("VIII · Appendix — Copy application drafts (per-page lever maps + final strings)", [
        "docs/research/copy/drafts/home.md",
        "docs/research/copy/drafts/software.md",
        "docs/research/copy/drafts/voice.md",
        "docs/research/copy/drafts/automations.md",
        "docs/research/copy/drafts/web.md",
        "docs/research/copy/drafts/work.md",
        "docs/research/copy/drafts/about.md",
        "docs/research/copy/drafts/contact.md",
        "docs/research/copy/drafts/pricing.md",
        "docs/research/copy/drafts/revision-pass.md",
    ]),
]

today = datetime.date.today().isoformat()
buf = []
buf.append("# GAELWORX — Research, Consolidated\n")
buf.append(
    f"**The single home for every research doc in this project.** Auto-assembled {today} from the "
    "files under `docs/research/`. Each source file is embedded verbatim below under its own heading; "
    "the original files are kept in place as the editable sources. Re-run `python3 scripts/build-research.py` "
    "to refresh this consolidation after editing any source.\n"
)
buf.append("---\n")
buf.append("## Table of Contents\n")
for title, files in PARTS:
    buf.append(f"- **Part {title}**")
    for f in files:
        buf.append(f"  - `{f}`")
buf.append("")

missing = []
for title, files in PARTS:
    buf.append("\n---\n")
    buf.append(f"# Part {title}\n")
    for f in files:
        p = ROOT / f
        buf.append("<!-- ============================================================ -->")
        buf.append(f"## Source: `{f}`\n")
        if p.is_file():
            buf.append(p.read_text(encoding="utf-8").rstrip("\n"))
            buf.append("")
        else:
            buf.append(f"> MISSING: {f}\n")
            missing.append(f)

OUT.write_text("\n".join(buf) + "\n", encoding="utf-8")
print("wrote", OUT.relative_to(ROOT))
print("lines:", len(OUT.read_text(encoding='utf-8').splitlines()))
print("missing:", missing or "none")
