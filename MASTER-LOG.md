# ExtractFlow: Master Log

## Kickoff

- **Created:** 30 Mar 2026
- **Purpose:** Swiss Army knife for web extraction. Replaces Playwright MCP interactive sessions and dead Firecrawl MCP with agentic, one-command extraction.
- **Origin:** Extracted from `.claude/skills/webapp-testing/scripts/` (built 27-30 Mar 2026)
- **Repo:** `sellersessions/extract-flow` (public)
- **Wired into:** project-registry.json (trigger keywords + capture patterns), MEMORY.md, project_web_extraction_stack.md
- **Routing:** `ROUTING-AND-INDEX.md` at the root, then the one in `scripts/` or `templates/`

**Kickoff prompt (refreshed 25 Oct 2026):**

```
Resume ExtractFlow (extract-flow/). Read CLAUDE.md, then ROUTING-AND-INDEX.md, then only the
files the routing row for this task names. Read this log's Next Up and its latest session entry,
nothing older. Logged-in extractions run on the automation browser at port 9334, never Comet on
9222. Output goes to results/ (ignored by git). Task: <one line>.
```

## Next Up

Re-dated 25 Oct 2026. The list is unchanged since April and May; the tidy kept every item.

- [ ] **Amazon Image Audit skill**: spec locked 21 Apr. Kickoff: [`docs/05-AMAZON-IMAGE-AUDIT.md`](docs/05-AMAZON-IMAGE-AUDIT.md). Mode 3 build (5 files, ~2 hrs): serp-extract.js, download-images.js, vision-analyze.js, nb2-runner.js, `.claude/skills/amazon-image-audit/SKILL.md`. Conference-ready demo target (SSL 2026).
- [ ] Team onboarding: share repo URL with Alex and Leo
- [ ] Add more examples (Seller Central, Xero, Wise)
- [ ] Consider auto-escalation wrapper script (T1 to T2 to T3 in one call)
- [ ] Test on more authenticated services via CDP

---

## Session Log

### Session 4, 25 Oct 2026 17:38 GMT: Stage 3 tidy (housekeeper, README, routing)

**What:** Folder tidy on the signed-off plan `ClaudeFlow-Agent/plans/extract-flow-stage-3-tidy.plan.md`. Nothing deleted.

| Step | Change |
|---|---|
| 1 | `.gitignore` widened to all of `results/` (keeping `.gitkeep`), `_archive/` added, the dead `~/.claude/browser-profiles/` line removed. The 165 untracked results files can no longer be staged |
| 2 | `tiktok-extract.mjs`, `tiktok-fav-top100.mjs`, `tiktok-favorites.mjs` archived to `_archive/root-2026-10-25/` (git rm plus copy, still in history). Root 11 files to 8 |
| 3 | Results files left in place, ignored, per Danny |
| 4 | README rebuilt on the shared README framework with the shell palette: TL;DR, Test protocol, automation browser and utilities documented, Tidy record, Build Timeline, MIT licence. Three new logos. Old README and logos in `_archive/readme-2026-10-25/` |
| 5 | Routing: `ROUTING-AND-INDEX.md` at the root, in `scripts/` and in `templates/`; "Routing, read first" pointer at the top of `CLAUDE.md`, the rules beneath unchanged |
| 6 | This log: 17 em dashes and 11 arrows replaced by script, pre-cleanse copy in `_archive/master-log-2026-10-25/`. Kickoff prompt added, Next Up re-dated |

**Decisions (Danny, 25 Oct):** results stay in place and ignored; the TikTok scripts are archived, not moved to `scripts/`; README refreshed and re-skinned, not re-minted; licence MIT, matching claude-ui-workflow.

**Not in scope, noted:** 64 em dashes in `docs/` and `examples/`; `CLAUDE.md` File Layout still says seven scripts (eleven on disk), left because the routing skill never rewrites the body; the parent repository gitlink pointer.

---

### 21 May 2026 10:30 BST: Markdown to PDF batch converter added

**What:** New tool at `scripts/md-to-pdf-batch.mjs`. Recursive batch converter for markdown files to professional-styled PDF, used to generate the Hannah / Allison filing-pack companion PDFs for the Form E divorce disclosure workspace.

**Why:** Solicitors and accountants do not use markdown readers. The Form E pack contains several markdown evidence files (strategic narratives, Barclays mortgage warning, Living Conditions summary) that needed PDF siblings without manual export. Established the markdown to PDF route as a generic ExtractFlow capability rather than a one-off form-e script.

**How:**
- `marked` npm package installed for markdown to HTML conversion (`npm install marked` in extract-flow root)
- HTML wrapped in print-friendly CSS (A4 / Avenir-family sans-serif / purple H1+H2 / proper table + blockquote + code styling)
- Playwright chromium with `page.emulateMedia({ media: 'print' })` per memory `feedback_playwright_pdf_use_print_media.md`
- Recursive folder walk; one PDF per `.md` file alongside the original
- Idempotent: re-running overwrites existing PDFs

**Usage:**

```
cd extract-flow
node scripts/md-to-pdf-batch.mjs "/path/to/root/folder"
```

**Image-embed caveat:** chromium embeds full-resolution source images in the PDF when markdown image syntax `![alt](path)` is used. 19 iPhone photos in the Living Conditions evidence pack produced a 193 MB PDF on first run. Decision: leave images as separate files in the folder structure, use inline-code paths in the markdown rather than image syntax. Text-only PDF stays under 200 KB; visual evidence remains accessible as native JPGs in the source folders.

**Decisions made:**
- ExtractFlow now covers markdown to PDF batch as a first-class tool. Documented in this MASTER-LOG entry; README update deferred unless / until a generic toolkit description is needed.
- Print-media emulation is the standard pattern (per `feedback_playwright_pdf_use_print_media.md`); applied here from the start, no retroactive fix needed.

---

### 30 Mar 2026 12:45 BST: Repo Creation + README Reframe

**What:** Created standalone ExtractFlow repo, tested CDP on Comet, rewrote README.

**Phase 1: CDP Test + Bug Fix:**
- Fixed `--connect` arg parser bug in dev-extract.js (was consuming next flag as value)
- Launched Comet with CDP via launch-cdp.sh: confirmed Chrome/145 on port 9222
- Tested 3 targets: example.com (pass), Airbnb account settings (full auth extraction), WP admin (session_expired correctly detected)

**Phase 2: Repo Creation:**
- Created `sellersessions/extract-flow` on GitHub (initially private, switched to public)
- Scaffolded folder structure: scripts/, templates/, examples/, docs/, assets/
- Copied 6 scripts + 4 SeleniumBase templates
- Created package.json, requirements.txt, .gitignore
- Generated dark/light logo SVGs matching ClaudeFlow visual standard
- Wrote 4MAT README with 4 Mermaid diagrams (agentic comparison, cascade, routing tree, escalation)
- Wrote 4 numbered docs (architecture, routing, installation, troubleshooting)
- Wrote 3 example walkthroughs (Amazon PDP, authenticated pages, batch scrape)
- MASTER-LOG.md, CLAUDE.md created

**Phase 3: README Reframe:**
- Danny flagged: this is multi-purpose, not Amazon-specific
- Rewrote README: Swiss Army knife positioning, Playwright problem (token waste), subscription problem (Firecrawl), overkill problem (SeleniumBase)
- New "Agentic Extraction" section: standard automation (7 steps) vs ExtractFlow (URL in, JSON out)
- Comparison table: 5-15 tool calls vs 1, 2-30K tokens vs 200-500, $0.10-0.50 vs $0.01
- 8 real-world example categories: e-commerce, SaaS dashboards, CMS, travel, content, batch, localhost, government

**Phase 4: Ecosystem Wiring:**
- Added ExtractFlow to project-registry.json (trigger keywords, capture patterns)
- Updated MEMORY.md: project entry + infrastructure entry
- Updated project_web_extraction_stack.md with repo name
- Saved feedback: default repos to public (avoid invite overhead)
- Switched repo from private to public

**Decisions:**
- Name: ExtractFlow (over WebCascade and Siphon), ecosystem consistency with ClaudeFlow
- Visibility: Public, avoids collaborator invite overhead
- Tagline: "A Swiss Army knife for web extraction"

---

### 21 Apr 2026 17:40 BST: Amazon Image Audit Spec (Session Capture, No Build)

**What:** Explored extending ExtractFlow into a conference-ready Amazon image audit for SSL 2026 sellers. No code changes to ExtractFlow core; spec captured in full.

**Phase 1: PDP validation (live):**
- Ran `scripts/extract.js` on Owala B0FJN3BTPV with custom Amazon selectors.
- Captured: title, ASIN, UPC/GTIN, brand, dimensions, weight, features (5), rating (4.7 / 117k), BSR (#1 Sports & Outdoors / #1 Water Bottles), breadcrumb, 6-variant table.
- **Geo signal discovered:** headless Chromium runs from UK egress, so Amazon.com auto-localised to GBP, AmazonGlobal Shipping, UK delivery dates. Future SERP work may need US proxy for USD pricing.
- Missing fields confirmed: Item Type Keyword + Product Type (SP-API only), Sold by / Ships from (lazy-loaded), images (T2 doesn't capture by default).
- Raw JSON: `_captures/amazon-owala/pdp-targeted.json` (172 KB).

**Phase 2: Spec for `/amazon-image-audit` skill:**
- Full spec + ASCII flow + vision enum schema + NB2 prompt rules + seller UX walkthrough captured in `docs/05-AMAZON-IMAGE-AUDIT.md`.
- 5 commonality checks for sellers: props, colours, angle, fill %, overlay text, packaging.
- Two visual patterns named: "Earned Silence" (review moat) vs "Loud New Entrant".
- Trust-badge-as-physical-object trick documented (photographed leather tag vs banned text overlay).
- Interview loop locked to 3 questions: review count, price band, USP.
- NB2 handoff via Kie.ai (~$48 balance). Reference-image anchor rule + photograph-not-product rule baked into prompt schema.

**Phase 3: Capture + session close:**
- Document written to `docs/05-AMAZON-IMAGE-AUDIT.md` with kickoff prompt at top for next-session paste-in.
- This master log entry written before running `/session-close`.

**Decisions:**
- Build scope: Mode 3 (5 files, ~2 hrs), 4 scripts + 1 skill file.
- Default vision provider: Claude Vision (schema adherence). OpenRouter + Kie.ai as fallbacks.
- NB2 model: `nano-banana-2` via Kie.ai (not Pro). Reference-image parameter mandatory.
- No code committed this session: spec-only capture before build.

**Next session kickoff:** Open `docs/05-AMAZON-IMAGE-AUDIT.md`, then paste the "NEXT SESSION KICKOFF PROMPT" block at top, then scaffold `SKILL.md` first, then the 4 scripts.
