# templates/ routing and index

Written 25 Oct 2026. Four SeleniumBase tier 3 templates. Each one's opening docstring says how it is copied and customised. Sizes are bytes; none is over 12,000.

| Task | Read | Skip | Use |
|---|---|---|---|
| Stealth extraction of one page | `scrape_page.py` | the other three templates | `browser-automation` skill |
| Stealth extraction behind a login | `auth_flow.py` | the other three templates | `browser-automation` skill |
| Fill and submit a form past anti-bot | `form_fill.py` | the other three templates | `browser-automation` skill |
| Walk several pages in one stealth session | `multi_page.py` | the other three templates | `browser-automation` skill |

Every row: tier 3 is the last resort; try `../scripts/scrape.py` and `../scripts/extract.js` first (`../docs/02-ROUTING.md`).

| File | Bytes | Last changed | Does |
|---|---|---|---|
| `scrape_page.py` | 1,694 | 2026-03-30 | One page, UC Mode |
| `auth_flow.py` | 2,068 | 2026-03-30 | Log in, then extract, persistent profile |
| `form_fill.py` | 1,846 | 2026-03-30 | Fill a form |
| `multi_page.py` | 1,754 | 2026-03-30 | Several pages in one session |
