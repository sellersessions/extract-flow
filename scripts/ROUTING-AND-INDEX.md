# scripts/ routing and index

Written 25 Oct 2026. Eleven scripts. Sizes are bytes; none is over 12,000.

| Task | Read | Skip | Use |
|---|---|---|---|
| Extract a public page | `../docs/02-ROUTING.md` | the other nine scripts, `../templates/` | `scrape.py`, then `extract.js` if the JSON carries a `fallback` |
| Extract many pages at once | `../examples/batch-scrape.md` | everything else | `batch-extract.js` |
| Extract a logged-in page | `../examples/authenticated-page.md`, the "Authenticated extractions" section of `../CLAUDE.md` | `launch-cdp.sh` (port 9222, only when Danny says so) | `launch-automation-browser.sh`, then `dev-extract.js --connect http://localhost:9334` |
| Verification capture for a sister project | nothing | everything else | `inspect.js` (starts its own browser on port 9333) |
| Convert markdown to PDF in batch | nothing | everything else | `md-to-pdf-batch.mjs` |
| Survey or pull Gmail threads | nothing | everything else | `gmail-inbox-survey.js`, `gmail-thread-pull.js`, on the automation browser logged in to Gmail |
| Stealth extraction past anti-bot | nothing here | everything | hand to `../templates/` |

Every row: scripts are run with `--help` first; their source is opened only to customise them (`../CLAUDE.md`).

| File | Bytes | Last changed | Does |
|---|---|---|---|
| `scrape.py` | 5,642 | 2026-03-30 | Tier 1, HTTP with Cloudflare bypass |
| `extract.js` | 7,013 | 2026-03-30 | Tier 2, headless Chromium |
| `batch-extract.js` | 6,519 | 2026-03-30 | Tier 2, many URLs at once, JSONL out |
| `dev-extract.js` | 7,012 | 2026-03-30 | Auth tier, connects to a running browser over CDP |
| `launch-automation-browser.sh` | 3,512 | 2026-04-22 | Starts, checks or stops the automation browser on port 9334 |
| `launch-cdp.sh` | 2,175 | 2026-04-22 | Relaunches Comet or Chrome on port 9222; rarely needed |
| `inspect.js` | 11,194 | 2026-04-05 | Persistent browser for verification captures, port 9333 |
| `md-to-pdf-batch.mjs` | 3,987 | 2026-05-21 | Every `.md` under a folder to a `.pdf` beside it |
| `gmail-inbox-survey.js` | 1,939 | 2026-05-20 | Lists Gmail threads matching a search |
| `gmail-thread-pull.js` | 4,001 | 2026-05-20 | Saves one Gmail thread as JSON |
| `with_server.py` | 3,693 | 2026-03-30 | Starts local servers, runs a command, stops them |
