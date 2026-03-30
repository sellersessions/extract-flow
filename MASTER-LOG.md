# ExtractFlow — Master Log

## Kickoff

- **Created:** 30 Mar 2026
- **Purpose:** Standalone 4-tier web extraction cascade for team sharing
- **Origin:** Extracted from `.claude/skills/webapp-testing/scripts/` (built 27-30 Mar 2026)
- **Repo:** `sellersessions/extract-flow` (private)

## Next Up

- Team onboarding: share repo with Alex and Leo
- Add more examples (Seller Central, Xero, Wise)
- Consider auto-escalation wrapper script

---

## Session Log

### 30 Mar 2026 — Repo Creation

**What:** Packaged the 4-tier extraction stack into standalone repo.

- Copied 6 scripts (scrape.py, extract.js, batch-extract.js, dev-extract.js, launch-cdp.sh, with_server.py)
- Copied 4 SeleniumBase templates (auth_flow, scrape_page, form_fill, multi_page)
- Created visual README with 4MAT structure, 3 Mermaid diagrams, badges
- Created package.json + requirements.txt for clean installation
- All scripts tested: T1 (HTTP), T2 (headless), Auth (CDP via Comet), session detection

**Context:** Built across sessions 27-30 Mar. Replaces dead Firecrawl MCP. Dev-browser CDP tested against Comet (Chrome/145) — Airbnb auth extraction confirmed working, WP admin login redirect correctly detected.
