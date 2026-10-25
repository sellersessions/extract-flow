# CLAUDE.md - ExtractFlow

## Routing, read first

Open `ROUTING-AND-INDEX.md` in this folder before anything else. It says which of the two workspaces (`scripts/`, `templates/`) holds the work, which files each task reads, and which to leave closed; each workspace has its own `ROUTING-AND-INDEX.md`.
Written 25 Oct 2026 by the Jake folder system. It points at files and adds no instructions. The rules below are unchanged.

## Project Rules

- **Scripts are black boxes.** Run with `--help` first. Don't read source unless customisation is needed.
- **Always start at T1.** Escalate only when a tier fails. Don't jump to SeleniumBase for a blog post.
- **JSON output only.** All scripts return JSON to stdout. Parse, don't scrape the output.
- **50KB cap.** Scripts truncate output to prevent context window overflow.
- **Auth tier = read-only by default.** Never fill forms or click buttons without explicit `--read-only false`.
- **CDP requires browser relaunch.** Run `launch-cdp.sh` after quitting the browser. Sessions expire independently.
- **NEVER attach to Comet (port 9222) for authenticated extractions.** Comet is Danny's live working browser on Desktop 1; CDP navigation steals focus and renders his Mac unusable for other work. Use the dedicated automation Chromium on port 9334 instead (see below).

## Authenticated extractions - use the automation browser

For any extraction that needs a logged-in session (claude.ai, Gmail web, WordPress admin, Stripe, etc.):

1. **Ensure the automation browser is running:**
   ```bash
   ./scripts/launch-automation-browser.sh check || ./scripts/launch-automation-browser.sh
   ```
   Launches Playwright's bundled Chromium on CDP port **9334** with a persistent profile at `~/.extract-flow/automation-profile/`. First launch requires Danny to drag the window to Desktop 2 and right-click dock icon → Options → Assign To → This Desktop.

2. **Log in once per service.** Cookies persist in the profile dir. No re-login between sessions.

3. **Connect extractions to 9334, not 9222:**
   ```bash
   node scripts/dev-extract.js --url <URL> --connect http://localhost:9334
   ```

4. **Comet (9222) is only for extractions that require Danny's personal session AND he has explicitly approved the disruption.** Default to automation. Escalate to Comet only if asked.

## File Layout

- `scripts/` - The 7 extraction scripts (T1, T2, Auth, Interactive, utilities)
- `templates/` - SeleniumBase T3 templates (copy, customise, run)
- `examples/` - Walkthrough docs for common extraction tasks
- `docs/` - Numbered deep-dive documentation
- `results/` - Output directory (.gitignored)

## Dependencies

- T1 (scrape.py): Python 3.10+ with cloudscraper25 + BeautifulSoup4
- T2 (extract.js, batch-extract.js): Node 18+ with Playwright + Chromium
- Auth (dev-extract.js): Node 18+ with dev-browser CLI (global install)
- Interactive (inspect.js): Node 18+ with Playwright + Chromium (CDP on port 9333)
- T3 (templates): Python 3.10+ with SeleniumBase
