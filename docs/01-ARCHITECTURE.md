# 01 — Architecture

## The Cascade Model

ExtractFlow is a **waterfall extraction system**. It always starts with the lightest tool and escalates only when that tool fails.

```
Request → T1 (HTTP) → success? → done
                    → fail?    → T2 (headless) → success? → done
                                               → fail?    → T3 (stealth) → done
```

For authenticated pages, the flow branches:

```
Request → needs login? → yes → CDP running? → yes → Auth (dev-extract.js)
                                             → no  → T3 (SeleniumBase + profile)
                       → no  → standard cascade (T1 → T2 → T3)
```

## Why This Order?

| Tier | Cost | Speed | Capability |
|------|------|-------|------------|
| T1 | Zero (HTTP only) | 2-5s | Static HTML, Cloudflare IUAM |
| T2 | Low (headless Chromium) | 10-15s | SPAs, JS rendering, lazy load |
| Auth | Low (reuses live browser) | 5-10s | Any page you're logged into |
| T3 | High (stealth browser) | 30-60s | Anti-bot, persistent profiles |

The cost is measured in both compute and tokens. T1 returns ~200 tokens of JSON. T3 may take 60 seconds and still return ~200 tokens. The difference is in what it takes to get there.

## Script Architecture

All scripts follow the same contract:

1. Accept `--url` and optional flags via CLI
2. Do the work (HTTP request, browser launch, CDP connection)
3. Return JSON to stdout
4. Return exit code 0 on success, 1 on failure
5. On failure, include `"fallback": "next_tier"` in the JSON

This means any script can be called from any context — Claude Code, shell, CI/CD, another script — and the output is always parseable.

## Output Contract

Every script returns a JSON object with these fields:

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Page title |
| `url` | string | Final URL (after redirects) |
| `meta` | object | Meta tags (name/property → content) |
| `content` | string | Body text (innerText) |
| `links` | array | `[{ text, href }]` |
| `tables` | array | `[{ headers, rows }]` |
| `source` | string | Which tool produced this (`cloudscraper`, `playwright`, `dev-browser`) |
| `fallback` | string | Which tier to try next (on failure) |
| `authenticated` | boolean | Whether auth cookies were used (Auth tier only) |
| `isLoginPage` | boolean | Whether a login redirect was detected |
| `custom` | object | Results from `--selectors` flag |
| `truncated` | boolean | Whether output was capped at 50KB |
