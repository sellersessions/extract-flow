# Example: Authenticated Page Extraction

## The Problem

You need data from a page that requires login (Seller Central, Xero, Airbnb dashboard). T1 and T2 launch fresh browsers with no cookies — they'll hit the login wall.

## Setup

```bash
# 1. Quit your browser
# 2. Relaunch with CDP
bash scripts/launch-cdp.sh

# 3. Verify CDP is running
bash scripts/launch-cdp.sh check
```

## Airbnb Account Settings

```bash
node scripts/dev-extract.js \
  --connect \
  --url "https://www.airbnb.com/account-settings"
```

**Result:** Full account details — name, email, phone, verification status, all nav links.

## Seller Central Dashboard

```bash
node scripts/dev-extract.js \
  --connect \
  --url "https://sellercentral.amazon.co.uk"
```

## WordPress Admin

```bash
node scripts/dev-extract.js \
  --connect \
  --url "https://sellersessions.com/wp-admin/"
```

**Note:** If your WP session has expired, you'll get:
```json
{
  "error": "session_expired",
  "message": "Redirected to login page — session may have expired",
  "isLoginPage": true
}
```

This is the expected signal — log in manually in the browser, then retry.

## Key Points

- Auth tier opens a **new tab** — won't touch your existing tabs
- Tab is **closed after extraction** — clean
- `--read-only true` by default — no form fills or clicks
- Works with any site you're logged into in your browser
