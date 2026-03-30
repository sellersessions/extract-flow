# 02 — Routing

## Decision Tree

```
"Get data from X"
    │
    ├─ Public page?
    │   ├─ Static / simple HTML    → T1: scrape.py       (~2-5s)
    │   ├─ JS-rendered / SPA       → T2: extract.js       (~10-15s)
    │   ├─ Batch (3+ URLs)         → T2: batch-extract.js
    │   └─ Anti-bot protected      → T3: SeleniumBase UC
    │
    └─ Authenticated / logged-in page?
        ├─ Session in browser      → Auth: dev-extract.js  (~5-10s)
        └─ Needs stealth + auth    → T3: SeleniumBase + persistent profile
```

## Anti-Bot Sites (Known T3)

These sites require SeleniumBase UC Mode:

- Amazon (.co.uk, .com) — product pages blocked at T1, work at T2 for public data
- Airbnb — public listings may need T3, account pages work at Auth
- Banking portals (Wise, Monzo)
- Court / government portals
- Any site with Cloudflare Bot Management, DataDome, or PerimeterX

## Failure Signals

Each script signals failure with a JSON `fallback` field:

| Script | Fallback Signal | Meaning |
|--------|----------------|---------|
| scrape.py | `"fallback": "playwright"` | HTTP failed — need a real browser |
| extract.js | `"fallback": "seleniumbase"` | Headless blocked — need stealth |
| dev-extract.js | `"error": "session_expired"` | Login redirect detected |

## When Auth Tier Wins

The Auth tier (`dev-extract.js --connect`) is the right choice when:

1. You're already logged into the service in your browser
2. The page doesn't have anti-bot protection (just auth)
3. You need data from a dashboard, admin panel, or SaaS app
4. Speed matters — Auth is faster than T3 (5-10s vs 30-60s)

Examples: Seller Central, Xero, Wise, Google Sheets, WordPress admin, any SaaS dashboard.
