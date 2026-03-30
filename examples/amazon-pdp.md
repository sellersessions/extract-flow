# Example: Amazon Product Detail Page

## The Problem

Amazon blocks T1 (HTTP) with CAPTCHA. Public product pages work at T2 (headless Playwright).

## Command

```bash
node scripts/extract.js \
  --url "https://www.amazon.co.uk/dp/B0BZHMMVLG" \
  --exclude "nav,footer,#navFooter" \
  --scroll
```

## What You Get

- **Title:** Full product title
- **Price:** Current price from the buy box
- **Features:** Bullet points from "About this item"
- **BSR:** Best Sellers Rank from Product Information table
- **Browse Nodes:** Category path from breadcrumb links
- **GL (productGroupID):** Available from page JavaScript

## What You Don't Get

These fields are **SP-API only** — not in the page source at any tier:

- Item Type Keyword
- Product Type

## Escalation Path

```
T1 (scrape.py) → CAPTCHA page → escalate to T2
T2 (extract.js) → full extraction works
```

## Custom Selectors Example

```bash
node scripts/extract.js \
  --url "https://www.amazon.co.uk/dp/B0BZHMMVLG" \
  --selectors '{"title": "#productTitle", "price": ".a-price-whole", "features": "#feature-bullets li"}'
```
