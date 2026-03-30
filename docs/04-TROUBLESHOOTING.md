# 04 — Troubleshooting

## Common Issues

### T1: scrape.py returns CAPTCHA content

**Symptom:** HTTP 200 but content is "Continue shopping" or similar challenge page.

**Cause:** The site has anti-bot protection that cloudscraper25 can't bypass.

**Fix:** Escalate to T2 (`extract.js`) or T3 (SeleniumBase). The script's JSON output will include `"fallback": "playwright"`.

### T2: extract.js times out

**Symptom:** Timeout error after 15-30 seconds.

**Cause:** Page is very heavy, or network is slow.

**Fix:** Increase timeout with `--timeout 30`. If it still fails, the site may be blocking headless browsers — escalate to T3.

### Auth: "session_expired" error

**Symptom:** `dev-extract.js` returns `{"error": "session_expired"}`.

**Cause:** Your browser session for that site has expired, or you're not logged in.

**Fix:** Open the site in your browser, log in manually, then retry the extraction.

### Auth: CDP not running

**Symptom:** `dev-extract.js --connect` fails with connection error.

**Cause:** Browser wasn't launched with CDP enabled.

**Fix:**
1. Quit your browser completely (Cmd+Q)
2. Run `bash scripts/launch-cdp.sh`
3. Wait for "CDP ready on port 9222"
4. Retry the extraction

### Auth: "Embedded daemon dependencies are missing"

**Symptom:** First run of dev-browser fails.

**Fix:** Run `dev-browser install` to download the daemon dependencies.

### T2: Playwright browser not found

**Symptom:** "Executable doesn't exist at chromium..."

**Fix:** Run `npx playwright install chromium` to download the browser binary.

### T1: "externally-managed-environment" pip error

**Symptom:** `pip install` fails with PEP 668 error.

**Fix:** Always install in a virtual environment:
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Escalation Cheat Sheet

| Problem | Action |
|---------|--------|
| HTTP blocked | T1 → T2 |
| Headless blocked | T2 → T3 |
| Needs login | → Auth (dev-extract.js) |
| Session expired | Re-login in browser, retry Auth |
| CDP not running | `launch-cdp.sh`, retry Auth |
| Anti-bot + auth | → T3 (SeleniumBase + profile) |
