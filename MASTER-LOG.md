# ExtractFlow — Master Log

## Kickoff

- **Created:** 30 Mar 2026
- **Purpose:** Swiss Army knife for web extraction. Replaces Playwright MCP interactive sessions and dead Firecrawl MCP with agentic, one-command extraction.
- **Origin:** Extracted from `.claude/skills/webapp-testing/scripts/` (built 27-30 Mar 2026)
- **Repo:** `sellersessions/extract-flow` (public)
- **Wired into:** project-registry.json (trigger keywords + capture patterns), MEMORY.md, project_web_extraction_stack.md

## Next Up

- [ ] **Amazon Image Audit skill** — spec locked 21 Apr. Kickoff: [`docs/05-AMAZON-IMAGE-AUDIT.md`](docs/05-AMAZON-IMAGE-AUDIT.md). Mode 3 build (5 files, ~2 hrs): serp-extract.js, download-images.js, vision-analyze.js, nb2-runner.js, `.claude/skills/amazon-image-audit/SKILL.md`. Conference-ready demo target (SSL 2026).
- [ ] Team onboarding: share repo URL with Alex and Leo
- [ ] Add more examples (Seller Central, Xero, Wise)
- [ ] Consider auto-escalation wrapper script (T1 → T2 → T3 in one call)
- [ ] Test on more authenticated services via CDP

---

## Session Log

### 30 Mar 2026 12:45 BST — Repo Creation + README Reframe

**What:** Created standalone ExtractFlow repo, tested CDP on Comet, rewrote README.

**Phase 1 — CDP Test + Bug Fix:**
- Fixed `--connect` arg parser bug in dev-extract.js (was consuming next flag as value)
- Launched Comet with CDP via launch-cdp.sh — confirmed Chrome/145 on port 9222
- Tested 3 targets: example.com (pass), Airbnb account settings (full auth extraction), WP admin (session_expired correctly detected)

**Phase 2 — Repo Creation:**
- Created `sellersessions/extract-flow` on GitHub (initially private, switched to public)
- Scaffolded folder structure: scripts/, templates/, examples/, docs/, assets/
- Copied 6 scripts + 4 SeleniumBase templates
- Created package.json, requirements.txt, .gitignore
- Generated dark/light logo SVGs matching ClaudeFlow visual standard
- Wrote 4MAT README with 4 Mermaid diagrams (agentic comparison, cascade, routing tree, escalation)
- Wrote 4 numbered docs (architecture, routing, installation, troubleshooting)
- Wrote 3 example walkthroughs (Amazon PDP, authenticated pages, batch scrape)
- MASTER-LOG.md, CLAUDE.md created

**Phase 3 — README Reframe:**
- Danny flagged: this is multi-purpose, not Amazon-specific
- Rewrote README: Swiss Army knife positioning, Playwright problem (token waste), subscription problem (Firecrawl), overkill problem (SeleniumBase)
- New "Agentic Extraction" section: standard automation (7 steps) vs ExtractFlow (URL in → JSON out)
- Comparison table: 5-15 tool calls vs 1, 2-30K tokens vs 200-500, $0.10-0.50 vs $0.01
- 8 real-world example categories: e-commerce, SaaS dashboards, CMS, travel, content, batch, localhost, government

**Phase 4 — Ecosystem Wiring:**
- Added ExtractFlow to project-registry.json (trigger keywords, capture patterns)
- Updated MEMORY.md: project entry + infrastructure entry
- Updated project_web_extraction_stack.md with repo name
- Saved feedback: default repos to public (avoid invite overhead)
- Switched repo from private → public

**Decisions:**
- Name: ExtractFlow (over WebCascade and Siphon) — ecosystem consistency with ClaudeFlow
- Visibility: Public — avoids collaborator invite overhead
- Tagline: "A Swiss Army knife for web extraction"

---

### 21 Apr 2026 17:40 BST — Amazon Image Audit Spec (Session Capture, No Build)

**What:** Explored extending ExtractFlow into a conference-ready Amazon image audit for SSL 2026 sellers. No code changes to ExtractFlow core; spec captured in full.

**Phase 1 — PDP validation (live):**
- Ran `scripts/extract.js` on Owala B0FJN3BTPV with custom Amazon selectors.
- Captured: title, ASIN, UPC/GTIN, brand, dimensions, weight, features (5), rating (4.7 / 117k), BSR (#1 Sports & Outdoors / #1 Water Bottles), breadcrumb, 6-variant table.
- **Geo signal discovered:** headless Chromium runs from UK egress → Amazon.com auto-localised to GBP, AmazonGlobal Shipping, UK delivery dates. Future SERP work may need US proxy for USD pricing.
- Missing fields confirmed: Item Type Keyword + Product Type (SP-API only), Sold by / Ships from (lazy-loaded), images (T2 doesn't capture by default).
- Raw JSON: `_captures/amazon-owala/pdp-targeted.json` (172 KB).

**Phase 2 — Spec for `/amazon-image-audit` skill:**
- Full spec + ASCII flow + vision enum schema + NB2 prompt rules + seller UX walkthrough captured in `docs/05-AMAZON-IMAGE-AUDIT.md`.
- 5 commonality checks for sellers: props, colours, angle, fill %, overlay text, packaging.
- Two visual patterns named: "Earned Silence" (review moat) vs "Loud New Entrant".
- Trust-badge-as-physical-object trick documented (photographed leather tag vs banned text overlay).
- Interview loop locked to 3 questions: review count, price band, USP.
- NB2 handoff via Kie.ai (~$48 balance). Reference-image anchor rule + photograph-not-product rule baked into prompt schema.

**Phase 3 — Capture + session close:**
- Document written to `docs/05-AMAZON-IMAGE-AUDIT.md` with kickoff prompt at top for next-session paste-in.
- This master log entry written before running `/session-close`.

**Decisions:**
- Build scope: Mode 3 (5 files, ~2 hrs) — 4 scripts + 1 skill file.
- Default vision provider: Claude Vision (schema adherence). OpenRouter + Kie.ai as fallbacks.
- NB2 model: `nano-banana-2` via Kie.ai (not Pro). Reference-image parameter mandatory.
- No code committed this session — spec-only capture before build.

**Next session kickoff:** Open `docs/05-AMAZON-IMAGE-AUDIT.md` → paste the "NEXT SESSION KICKOFF PROMPT" block at top → scaffold `SKILL.md` first, then the 4 scripts.
