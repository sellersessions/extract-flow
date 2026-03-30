# 03 — Installation

## Prerequisites

- **Node.js** >= 18 (for T2 + Auth scripts)
- **Python** >= 3.10 (for T1 + T3 scripts)
- **Git** (for cloning)

## Quick Install

```bash
# Clone
git clone git@github.com:sellersessions/extract-flow.git
cd extract-flow

# Node dependencies (installs Playwright + Chromium via postinstall)
npm install

# Python dependencies
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Optional: Auth Tier Setup

The Auth tier requires `dev-browser` (global install) and a CDP-enabled browser.

```bash
# Install dev-browser
npm install -g dev-browser
dev-browser install

# Launch your browser with CDP
bash scripts/launch-cdp.sh          # Comet (default)
bash scripts/launch-cdp.sh chrome   # Chrome
bash scripts/launch-cdp.sh check    # Verify CDP is running
```

**Important:** You must quit your browser first, then relaunch via `launch-cdp.sh`. The script adds `--remote-debugging-port=9222` which enables the Chrome DevTools Protocol connection.

## Optional: SeleniumBase (T3)

SeleniumBase is included in `requirements.txt`. For UC Mode (anti-bot bypass), no additional setup is needed — it manages its own browser binary.

For persistent profiles (login sessions across runs):

```bash
mkdir -p ~/.claude/browser-profiles/automation/
```

## Verify Installation

```bash
# T1
python scripts/scrape.py --url https://example.com

# T2
node scripts/extract.js --url https://example.com

# Batch
node scripts/batch-extract.js --urls "https://example.com,https://httpbin.org/html"

# Auth (requires CDP)
bash scripts/launch-cdp.sh check
node scripts/dev-extract.js --connect --url https://example.com
```

All commands should return JSON to stdout.
