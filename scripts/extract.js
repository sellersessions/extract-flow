#!/usr/bin/env node
/**
 * Tier 2: Full browser extraction via Playwright headless.
 *
 * For JS-rendered pages, SPAs, custom DOM manipulation, and localhost URLs.
 * Falls back here when scrape.py (Tier 1) can't handle the page.
 *
 * Usage:
 *   node extract.js --url https://example.com
 *   node extract.js --url https://example.com --exclude "nav,footer,.cookie-banner"
 *   node extract.js --url https://example.com --selectors '{"prices": ".price"}'
 *   node extract.js --url https://example.com --wait-for ".main-content" --scroll
 *   node extract.js --url http://localhost:3000 --timeout 15000
 */

const { chromium } = require('playwright');

const MAX_OUTPUT_BYTES = 50_000;

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    url: null,
    selectors: null,
    exclude: null,
    waitFor: null,
    scroll: false,
    timeout: 10000,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--url': opts.url = args[++i]; break;
      case '--selectors': opts.selectors = args[++i]; break;
      case '--exclude': opts.exclude = args[++i]; break;
      case '--wait-for': opts.waitFor = args[++i]; break;
      case '--scroll': opts.scroll = true; break;
      case '--timeout': opts.timeout = parseInt(args[++i], 10); break;
    }
  }

  if (!opts.url) {
    console.error('Usage: node extract.js --url <URL> [--exclude "nav,footer"] [--selectors \'{"key":"sel"}\'] [--wait-for ".selector"] [--scroll] [--timeout 10000]');
    process.exit(1);
  }

  return opts;
}

async function dismissCookieConsent(page) {
  const selectors = [
    // Common consent buttons
    'button[id*="accept" i]',
    'button[class*="accept" i]',
    'a[id*="accept" i]',
    '[data-testid*="accept" i]',
    // OneTrust
    '#onetrust-accept-btn-handler',
    // CookieBot
    '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll',
    // Generic patterns
    'button:has-text("Accept")',
    'button:has-text("Accept All")',
    'button:has-text("Accept all")',
    'button:has-text("I agree")',
    'button:has-text("Got it")',
    'button:has-text("OK")',
  ];

  for (const sel of selectors) {
    try {
      const btn = page.locator(sel).first();
      if (await btn.isVisible({ timeout: 500 })) {
        await btn.click({ timeout: 1000 });
        return;
      }
    } catch {
      // Selector not found, try next
    }
  }
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 400;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= document.body.scrollHeight || totalHeight > 20000) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
  // Wait for any lazy-loaded content
  await page.waitForTimeout(1000);
}

async function extract(opts) {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 720 },
    });
    const page = await context.newPage();

    // Navigate with timeout
    let response;
    try {
      response = await page.goto(opts.url, {
        waitUntil: 'networkidle',
        timeout: opts.timeout,
      });
    } catch {
      // Retry with longer timeout and domcontentloaded
      response = await page.goto(opts.url, {
        waitUntil: 'domcontentloaded',
        timeout: opts.timeout * 2,
      });
    }

    // Wait for specific selector if requested
    if (opts.waitFor) {
      try {
        await page.waitForSelector(opts.waitFor, { timeout: opts.timeout });
      } catch {
        // Continue anyway — partial extraction is better than nothing
      }
    }

    // Dismiss cookie consent
    await dismissCookieConsent(page);

    // Scroll to trigger lazy loading
    if (opts.scroll) {
      await autoScroll(page);
    }

    // Strip excluded elements
    if (opts.exclude) {
      const excludeSelectors = opts.exclude.split(',').map(s => s.trim());
      await page.evaluate((sels) => {
        for (const sel of sels) {
          document.querySelectorAll(sel).forEach(el => el.remove());
        }
      }, excludeSelectors);
    }

    // Extract data
    const data = await page.evaluate(() => {
      const title = document.title || '';

      // Meta tags
      const meta = {};
      document.querySelectorAll('meta[name], meta[property]').forEach(tag => {
        const key = tag.getAttribute('name') || tag.getAttribute('property');
        const val = tag.getAttribute('content');
        if (key && val) meta[key] = val;
      });

      // Main content text
      const content = document.body ? document.body.innerText : '';

      // Links
      const links = [];
      document.querySelectorAll('a[href]').forEach(a => {
        const href = a.getAttribute('href');
        if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
          links.push({ text: a.innerText.trim(), href });
        }
      });

      // Tables
      const tables = [];
      document.querySelectorAll('table').forEach(table => {
        const headers = [...table.querySelectorAll('th')].map(th => th.innerText.trim());
        const rows = [];
        table.querySelectorAll('tr').forEach(tr => {
          const cells = [...tr.querySelectorAll('td')].map(td => td.innerText.trim());
          if (cells.length) rows.push(cells);
        });
        tables.push({ headers, rows });
      });

      return { title, meta, content, links, tables };
    });

    const output = {
      url: opts.url,
      status: response ? response.status() : null,
      ...data,
    };

    // Custom selectors
    if (opts.selectors) {
      try {
        const selectors = JSON.parse(opts.selectors);
        const custom = await page.evaluate((sels) => {
          const result = {};
          for (const [name, sel] of Object.entries(sels)) {
            result[name] = [...document.querySelectorAll(sel)].map(el => el.innerText.trim());
          }
          return result;
        }, selectors);
        output.custom = custom;
      } catch (e) {
        output.selector_error = e.message;
      }
    }

    // Truncate if needed
    let raw = JSON.stringify(output);
    if (Buffer.byteLength(raw) > MAX_OUTPUT_BYTES) {
      const over = Buffer.byteLength(raw) - MAX_OUTPUT_BYTES;
      output.content = output.content.slice(0, -(over + 200)) + '\n... [truncated]';
      output.truncated = true;
    }

    console.log(JSON.stringify(output, null, 2));

  } finally {
    if (browser) await browser.close();
  }
}

const opts = parseArgs();
extract(opts).catch(err => {
  console.log(JSON.stringify({
    error: err.message,
    url: opts.url,
    fallback: 'seleniumbase',
  }));
  process.exit(1);
});
