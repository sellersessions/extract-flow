#!/usr/bin/env node
/**
 * Tier 2 Batch: Multi-URL extraction via Playwright headless.
 *
 * Wraps extract.js logic for multiple URLs with concurrency control.
 * Outputs JSONL (one JSON object per line) + summary.
 *
 * Usage:
 *   node batch-extract.js --urls "https://example.com,https://httpbin.org/html"
 *   node batch-extract.js --file urls.txt --concurrency 5 --delay 2000
 *   node batch-extract.js --urls "url1,url2" --exclude "nav,footer" --scroll
 */

const { chromium } = require('playwright');

const MAX_OUTPUT_BYTES = 50_000;

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    urls: [],
    file: null,
    exclude: null,
    waitFor: null,
    scroll: false,
    timeout: 10000,
    concurrency: 3,
    delay: 1000,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--urls': opts.urls = args[++i].split(',').map(u => u.trim()); break;
      case '--file': opts.file = args[++i]; break;
      case '--exclude': opts.exclude = args[++i]; break;
      case '--wait-for': opts.waitFor = args[++i]; break;
      case '--scroll': opts.scroll = true; break;
      case '--timeout': opts.timeout = parseInt(args[++i], 10); break;
      case '--concurrency': opts.concurrency = parseInt(args[++i], 10); break;
      case '--delay': opts.delay = parseInt(args[++i], 10); break;
    }
  }

  if (opts.file) {
    const fs = require('fs');
    const content = fs.readFileSync(opts.file, 'utf-8');
    opts.urls = content.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
  }

  if (!opts.urls.length) {
    console.error('Usage: node batch-extract.js --urls "url1,url2" [--file urls.txt] [--concurrency 3] [--delay 1000]');
    process.exit(1);
  }

  return opts;
}

async function dismissCookieConsent(page) {
  const selectors = [
    '#onetrust-accept-btn-handler',
    '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll',
    'button:has-text("Accept")',
    'button:has-text("Accept All")',
    'button:has-text("I agree")',
    'button:has-text("Got it")',
    'button:has-text("OK")',
  ];

  for (const sel of selectors) {
    try {
      const btn = page.locator(sel).first();
      if (await btn.isVisible({ timeout: 300 })) {
        await btn.click({ timeout: 500 });
        return;
      }
    } catch { /* next */ }
  }
}

async function extractPage(context, url, opts) {
  const page = await context.newPage();
  try {
    let response;
    try {
      response = await page.goto(url, { waitUntil: 'networkidle', timeout: opts.timeout });
    } catch {
      response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: opts.timeout * 2 });
    }

    if (opts.waitFor) {
      try { await page.waitForSelector(opts.waitFor, { timeout: opts.timeout }); } catch { /* continue */ }
    }

    await dismissCookieConsent(page);

    if (opts.scroll) {
      await page.evaluate(async () => {
        await new Promise(r => {
          let h = 0;
          const t = setInterval(() => { window.scrollBy(0, 400); h += 400; if (h >= document.body.scrollHeight || h > 20000) { clearInterval(t); r(); } }, 100);
        });
      });
      await page.waitForTimeout(1000);
    }

    if (opts.exclude) {
      await page.evaluate((sels) => {
        for (const sel of sels) document.querySelectorAll(sel).forEach(el => el.remove());
      }, opts.exclude.split(',').map(s => s.trim()));
    }

    const data = await page.evaluate(() => {
      const title = document.title || '';
      const meta = {};
      document.querySelectorAll('meta[name], meta[property]').forEach(tag => {
        const key = tag.getAttribute('name') || tag.getAttribute('property');
        const val = tag.getAttribute('content');
        if (key && val) meta[key] = val;
      });
      const content = document.body ? document.body.innerText : '';
      const links = [];
      document.querySelectorAll('a[href]').forEach(a => {
        const href = a.getAttribute('href');
        if (href && !href.startsWith('#') && !href.startsWith('javascript:'))
          links.push({ text: a.innerText.trim(), href });
      });
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

    const output = { url, status: response ? response.status() : null, ...data };

    // Truncate
    let raw = JSON.stringify(output);
    if (Buffer.byteLength(raw) > MAX_OUTPUT_BYTES) {
      const over = Buffer.byteLength(raw) - MAX_OUTPUT_BYTES;
      output.content = output.content.slice(0, -(over + 200)) + '\n... [truncated]';
      output.truncated = true;
    }

    return output;
  } catch (err) {
    return { url, error: err.message };
  } finally {
    await page.close();
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const opts = parseArgs();
  const startTime = Date.now();
  let success = 0;
  let failed = 0;

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 },
  });

  try {
    // Process in batches of `concurrency`
    for (let i = 0; i < opts.urls.length; i += opts.concurrency) {
      const batch = opts.urls.slice(i, i + opts.concurrency);
      const results = await Promise.all(batch.map(url => extractPage(context, url, opts)));

      for (const result of results) {
        if (result.error) { failed++; } else { success++; }
        console.log(JSON.stringify(result));
      }

      // Delay between batches (not after last)
      if (i + opts.concurrency < opts.urls.length) {
        await sleep(opts.delay);
      }
    }

    // Summary line
    console.log(JSON.stringify({
      _summary: true,
      total: opts.urls.length,
      success,
      failed,
      elapsed_ms: Date.now() - startTime,
    }));
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
});
