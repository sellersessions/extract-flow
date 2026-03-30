# ExtractFlow — Master Log

## Kickoff

- **Created:** 30 Mar 2026
- **Purpose:** Swiss Army knife for web extraction. Replaces Playwright MCP interactive sessions and dead Firecrawl MCP with agentic, one-command extraction.
- **Origin:** Extracted from `.claude/skills/webapp-testing/scripts/` (built 27-30 Mar 2026)
- **Repo:** `sellersessions/extract-flow` (public)
- **Wired into:** project-registry.json (trigger keywords + capture patterns), MEMORY.md, project_web_extraction_stack.md

## Next Up

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
