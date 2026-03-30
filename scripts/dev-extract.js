#!/usr/bin/env node
/**
 * Live Browser Extraction via dev-browser.
 *
 * Connects to your running Comet/Chrome browser via CDP.
 * Has access to all your cookies, sessions, and login state.
 * Opens a NEW tab, extracts data, closes tab. Won't touch existing tabs.
 *
 * PREREQUISITE: Browser must be running with CDP enabled.
 *   ./launch-cdp.sh         (launches Comet with CDP on port 9222)
 *   ./launch-cdp.sh check   (verify CDP is running)
 *
 * Usage:
 *   node dev-extract.js --url https://sellercentral.amazon.co.uk
 *   node dev-extract.js --url https://example.com --selectors '{"prices": ".price"}'
 *   node dev-extract.js --url https://example.com --exclude "nav,footer"
 *   node dev-extract.js --connect http://localhost:9222 --url https://example.com
 *
 * Without --connect: uses dev-browser's managed Chromium (no auth, like extract.js)
 * With --connect: attaches to your live browser (has your sessions!)
 */

const { execSync } = require('child_process');

const MAX_OUTPUT_BYTES = 50_000;

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    url: null,
    selectors: null,
    exclude: null,
    waitFor: null,
    scroll: false,
    connect: null,
    timeout: 20,
    readOnly: true,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--url': opts.url = args[++i]; break;
      case '--selectors': opts.selectors = args[++i]; break;
      case '--exclude': opts.exclude = args[++i]; break;
      case '--wait-for': opts.waitFor = args[++i]; break;
      case '--scroll': opts.scroll = true; break;
      case '--connect': {
        const next = args[i + 1];
        opts.connect = (next && !next.startsWith('--')) ? args[++i] : '';
        break;
      }
      case '--timeout': opts.timeout = parseInt(args[++i], 10); break;
      case '--read-only': opts.readOnly = args[++i] !== 'false'; break;
    }
  }

  if (!opts.url) {
    console.error('Usage: node dev-extract.js --url <URL> [--connect [CDP_URL]] [--selectors \'{"key":"sel"}\'] [--exclude "nav,footer"] [--wait-for ".selector"] [--scroll] [--timeout 20]');
    process.exit(1);
  }

  return opts;
}

function buildScript(opts) {
  // Build the dev-browser script that will run in the QuickJS sandbox
  const excludeSelectors = opts.exclude
    ? opts.exclude.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const customSelectors = opts.selectors
    ? JSON.parse(opts.selectors)
    : null;

  // The script must be self-contained — no require(), no imports
  // All variables are embedded as literals
  const script = `
const page = await browser.newPage();
try {
  await page.goto(${JSON.stringify(opts.url)}, { waitUntil: "networkidle", timeout: ${opts.timeout * 1000} });

  ${opts.waitFor ? `
  try { await page.waitForSelector(${JSON.stringify(opts.waitFor)}, { timeout: ${opts.timeout * 1000} }); } catch(e) {}
  ` : ''}

  ${opts.scroll ? `
  await page.evaluate(async () => {
    await new Promise(r => {
      let h = 0;
      const t = setInterval(() => { window.scrollBy(0, 400); h += 400; if (h >= document.body.scrollHeight || h > 20000) { clearInterval(t); r(); } }, 100);
    });
  });
  await new Promise(r => setTimeout(r, 1000));
  ` : ''}

  ${excludeSelectors.length > 0 ? `
  await page.evaluate((sels) => {
    for (const sel of sels) document.querySelectorAll(sel).forEach(el => el.remove());
  }, ${JSON.stringify(excludeSelectors)});
  ` : ''}

  const data = await page.evaluate(() => {
    const title = document.title || '';
    const currentUrl = window.location.href;

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
        links.push({ text: a.innerText.trim().substring(0, 100), href });
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

    // Detect login redirect
    const isLoginPage = currentUrl.includes('login') || currentUrl.includes('signin') ||
                        currentUrl.includes('auth') || currentUrl.includes('sso') ||
                        !!document.querySelector('input[type="password"]');

    return { title, url: currentUrl, meta, content, links, tables, isLoginPage };
  });

  ${customSelectors ? `
  const custom = await page.evaluate((sels) => {
    const result = {};
    for (const [name, sel] of Object.entries(sels)) {
      result[name] = [...document.querySelectorAll(sel)].map(el => el.innerText.trim());
    }
    return result;
  }, ${JSON.stringify(customSelectors)});
  data.custom = custom;
  ` : ''}

  // Check for session expiry
  if (data.isLoginPage && data.url !== ${JSON.stringify(opts.url)}) {
    data.error = "session_expired";
    data.message = "Redirected to login page — session may have expired";
  }

  // Truncate content if too large
  const raw = JSON.stringify(data);
  if (raw.length > ${MAX_OUTPUT_BYTES}) {
    const over = raw.length - ${MAX_OUTPUT_BYTES};
    data.content = data.content.slice(0, -(over + 200)) + '\\n... [truncated]';
    data.truncated = true;
  }

  data.source = "dev-browser";
  data.authenticated = ${opts.connect !== null};
  console.log(JSON.stringify(data, null, 2));

} finally {
  await page.close();
}
`;

  return script;
}

function main() {
  const opts = parseArgs();
  const script = buildScript(opts);

  // Build dev-browser command
  let cmd = `dev-browser --timeout ${opts.timeout}`;
  if (opts.connect !== null) {
    cmd += opts.connect ? ` --connect ${opts.connect}` : ' --connect';
  }

  try {
    const result = execSync(cmd, {
      input: script,
      encoding: 'utf-8',
      timeout: (opts.timeout + 5) * 1000,
      maxBuffer: 10 * 1024 * 1024,
    });

    // dev-browser outputs to stdout, pass it through
    process.stdout.write(result);
  } catch (err) {
    const output = err.stdout || '';
    const stderr = err.stderr || err.message || '';

    // Check if we got JSON output despite error exit code
    if (output.trim().startsWith('{')) {
      process.stdout.write(output);
    } else {
      console.log(JSON.stringify({
        error: stderr.substring(0, 500),
        url: opts.url,
        source: 'dev-browser',
        fallback: 'seleniumbase',
      }));
    }
    process.exit(1);
  }
}

main();
