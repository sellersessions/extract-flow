# Routing and index, read first

Written 25 Oct 2026 by the Jake folder system. Pointers only, no instructions. Two workspaces produce work (`scripts/`, `templates/`); everything else is reference. Index regenerated 2026-10-25. Sizes are bytes; FLAG marks a file over 12,000, so open the named section, not the whole file.

## Which workspace for which work

| Work | Go to | Then read |
|---|---|---|
| Extract a page (public, many at once or logged in), capture a page for verification, markdown to PDF, Gmail threads | `scripts/` | `scripts/ROUTING-AND-INDEX.md` |
| Stealth extraction past anti-bot | `templates/` | `templates/ROUTING-AND-INDEX.md` |
| Build the Amazon image audit skill | `docs/` | `docs/05-AMAZON-IMAGE-AUDIT.md`, the "NEXT SESSION KICKOFF PROMPT" section only (FLAG) |
| Refresh the README | root | `README.md`, with danny-readme-builder |

Every row: `CLAUDE.md` holds the operating rules (start at tier 1, logged-in work on the automation browser at port 9334, never Comet on 9222).

## Folders

| Folder | Kind | Files | Bytes | Open when |
|---|---|---|---|---|
| `scripts/` | Workspace | 12 | 58,998 | running or fixing an extraction or utility script |
| `templates/` | Workspace | 5 | 8,519 | a stealth (tier 3) extraction |
| `docs/` | Reference | 5 | 34,336 | architecture, routing, installation, troubleshooting, the image audit spec |
| `examples/` | Reference | 3 | 4,029 | a worked walkthrough: Amazon product page, logged-in page, batch |
| `assets/` | Reference | 3 | 2,576 | README logos |
| `results/` | Local only | 166 | 1,094,347 | extraction output; ignored by git except `.gitkeep`, never pushed |
| `_captures/` | Local only | 2 | 351,932 | browser captures, ignored by git |
| `_archive/` | Local only | 7 | 33,644 | retired files, ignored by git; never pushed |
| `node_modules/` | Local only | not counted | not counted | never; reinstall with `npm install` |

## Root documents

| File | Bytes | Last changed | Open when |
|---|---|---|---|
| `CLAUDE.md` | 3,002 | 2026-10-25 | first, every session: operating rules |
| `MASTER-LOG.md` | 10,009 | 2026-10-25 | kickoff prompt and latest session only |
| `README.md` | 30,390 FLAG | 2026-10-25 | the public front page; refresh with danny-readme-builder |
| `LICENSE` | 1,072 | 2026-10-25 | MIT, Copyright 2026 Seller Sessions |
| `package.json` | 608 | 2026-10-25 | Node dependencies and `npm run` names |
| `package-lock.json` | 2,206 | 2026-05-21 | never by hand |
| `requirements.txt` | 66 | 2026-03-30 | Python dependencies for tiers 1 and 3 |
| `.gitignore` | 104 | 2026-10-25 | before adding a new output folder |

## Naming rules

- Node or shell script: lower-case kebab in `scripts/`, for example `batch-extract.js`.
- Python tier 3 template: snake_case in `templates/`, for example `auth_flow.py`.
- Deep-dive doc: `NN-UPPER-KEBAB.md` in `docs/`, for example `04-TROUBLESHOOTING.md`.
- Walkthrough: lower-case kebab `.md` in `examples/`, for example `amazon-pdp.md`.
- Output `results/<topic>/`, captures `_captures/<feature>/`, finished-with files `_archive/<group>-YYYY-MM-DD/`. All three are ignored by git. Never at the root.
