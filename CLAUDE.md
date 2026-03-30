# CLAUDE.md — ExtractFlow

## Project Rules

- **Scripts are black boxes.** Run with `--help` first. Don't read source unless customisation is needed.
- **Always start at T1.** Escalate only when a tier fails. Don't jump to SeleniumBase for a blog post.
- **JSON output only.** All scripts return JSON to stdout. Parse, don't scrape the output.
- **50KB cap.** Scripts truncate output to prevent context window overflow.
- **Auth tier = read-only by default.** Never fill forms or click buttons without explicit `--read-only false`.
- **CDP requires browser relaunch.** Run `launch-cdp.sh` after quitting the browser. Sessions expire independently.

## File Layout

- `scripts/` — The 6 extraction scripts (T1, T2, Auth, utilities)
- `templates/` — SeleniumBase T3 templates (copy, customise, run)
- `examples/` — Walkthrough docs for common extraction tasks
- `docs/` — Numbered deep-dive documentation
- `results/` — Output directory (.gitignored)

## Dependencies

- T1 (scrape.py): Python 3.10+ with cloudscraper25 + BeautifulSoup4
- T2 (extract.js, batch-extract.js): Node 18+ with Playwright + Chromium
- Auth (dev-extract.js): Node 18+ with dev-browser CLI (global install)
- T3 (templates): Python 3.10+ with SeleniumBase
