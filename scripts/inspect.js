#!/usr/bin/env node
/**
 * Interactive Inspection — persistent browser sessions via CLI.
 *
 * Unlike extract.js (one-shot), this keeps a browser alive between calls.
 * Uses CDP connection so pages persist across CLI invocations.
 * Claude calls commands via Bash — no MCP dependency, self-healing.
 *
 * Usage:
 *   node inspect.js start [--viewport 1440x900]
 *   node inspect.js navigate <url>
 *   node inspect.js screenshot [--path file.png] [--full-page]
 *   node inspect.js eval "<js expression>"
 *   node inspect.js click "<selector>"
 *   node inspect.js hover "<selector>"
 *   node inspect.js scroll [amount]
 *   node inspect.js resize <width> <height>
 *   node inspect.js snapshot
 *   node inspect.js stop
 */

const { chromium } = require('playwright');
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const http = require('http');

const STATE_FILE = '/tmp/inspect-tool.json';
const DEFAULT_VIEWPORT = { width: 1440, height: 900 };
const CDP_PORT = 9333; // Different from dev-extract.js (9222) to avoid conflicts

// --- State management ---

function readState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return null;
  }
}

function writeState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function clearState() {
  try { fs.unlinkSync(STATE_FILE); } catch {}
}

// --- Check if CDP is alive ---

function checkCDP(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/json/version`, { timeout: 2000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

// --- Browser lifecycle ---
// Launch Chromium as a standalone process (not tied to Node.js lifecycle).
// Uses spawn with detached:true so the browser outlives this script.

async function launchBrowser(viewport) {
  const vp = viewport || DEFAULT_VIEWPORT;

  // Kill any existing browser on our port
  try { execSync(`lsof -ti:${CDP_PORT} | xargs kill -9 2>/dev/null`, { stdio: 'ignore' }); } catch {}
  await new Promise(r => setTimeout(r, 500));

  // Get Chromium path from Playwright
  const chromiumPath = chromium.executablePath();
  if (!fs.existsSync(chromiumPath)) {
    throw new Error('Chromium not found. Run: cd extract-flow && npm install');
  }

  // Launch as detached process — survives script exit
  const proc = spawn(chromiumPath, [
    `--remote-debugging-port=${CDP_PORT}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    `--window-size=${vp.width},${vp.height}`,
    'about:blank',
  ], {
    detached: true,
    stdio: 'ignore',
  });
  proc.unref();

  // Wait for CDP to be ready
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 500));
    const info = await checkCDP(CDP_PORT);
    if (info) {
      writeState({
        pid: proc.pid,
        port: CDP_PORT,
        viewport: vp,
        startedAt: new Date().toISOString(),
      });
      return proc.pid;
    }
  }

  throw new Error('Browser launched but CDP not responding');
}

async function getPage() {
  const state = readState();

  // Check if browser is alive via CDP
  let info = await checkCDP(CDP_PORT);
  if (!info) {
    // Self-heal: relaunch
    await launchBrowser(state?.viewport);
    info = await checkCDP(CDP_PORT);
    if (!info) throw new Error('Failed to connect to browser');
  }

  // Connect via CDP — pages persist because browser is independent process
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${CDP_PORT}`);
  const contexts = browser.contexts();
  let page;

  if (contexts.length > 0 && contexts[0].pages().length > 0) {
    page = contexts[0].pages()[0];
  } else {
    const context = contexts[0] || await browser.newContext();
    page = await context.newPage();
  }

  return { browser, page };
}

// --- Commands ---

async function cmdStart(args) {
  let viewport = DEFAULT_VIEWPORT;
  const vpIdx = args.indexOf('--viewport');
  if (vpIdx >= 0 && args[vpIdx + 1]) {
    const [w, h] = args[vpIdx + 1].split('x').map(Number);
    if (w && h) viewport = { width: w, height: h };
  }

  // Check if already running
  const info = await checkCDP(CDP_PORT);
  if (info) {
    return { status: 'ok', reused: true, viewport, cdpPort: CDP_PORT };
  }

  const pid = await launchBrowser(viewport);
  return { status: 'ok', reused: false, pid, viewport, cdpPort: CDP_PORT };
}

async function cmdNavigate(args) {
  const url = args[0];
  if (!url) return { error: 'Usage: navigate <url>' };

  const { browser, page } = await getPage();
  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    const title = await page.title();
    return { status: 'ok', url: page.url(), title, httpStatus: response?.status() };
  } catch (err) {
    return { error: err.message, url };
  } finally {
    // Disconnect client only — do NOT call browser.close() (kills browser via CDP)
  }
}

async function cmdScreenshot(args) {
  const pathIdx = args.indexOf('--path');
  const fullPage = args.includes('--full-page');
  const outPath = pathIdx >= 0 ? args[pathIdx + 1] : `/tmp/inspect-${Date.now()}.png`;

  const { browser, page } = await getPage();
  try {
    await page.screenshot({ path: outPath, fullPage });
    return { status: 'ok', path: outPath, fullPage };
  } finally {
    // Disconnect client only — do NOT call browser.close() (kills browser via CDP)
  }
}

async function cmdEval(args) {
  const js = args.join(' ');
  if (!js) return { error: 'Usage: eval "<js expression>"' };

  const { browser, page } = await getPage();
  try {
    const result = await page.evaluate(js);
    return { status: 'ok', result };
  } catch (err) {
    return { error: err.message };
  } finally {
    // Disconnect client only — do NOT call browser.close() (kills browser via CDP)
  }
}

async function cmdClick(args) {
  const selector = args.join(' ');
  if (!selector) return { error: 'Usage: click "<selector>"' };

  const { browser, page } = await getPage();
  try {
    await page.click(selector, { timeout: 5000 });
    return { status: 'ok', selector };
  } catch (err) {
    return { error: err.message, selector };
  } finally {
    // Disconnect client only — do NOT call browser.close() (kills browser via CDP)
  }
}

async function cmdHover(args) {
  const selector = args.join(' ');
  if (!selector) return { error: 'Usage: hover "<selector>"' };

  const { browser, page } = await getPage();
  try {
    await page.hover(selector, { timeout: 5000 });
    return { status: 'ok', selector };
  } catch (err) {
    return { error: err.message, selector };
  } finally {
    // Disconnect client only — do NOT call browser.close() (kills browser via CDP)
  }
}

async function cmdScroll(args) {
  const amount = parseInt(args[0], 10) || 500;
  const { browser, page } = await getPage();
  try {
    const scrollY = await page.evaluate((px) => {
      window.scrollBy(0, px);
      return window.scrollY;
    }, amount);
    return { status: 'ok', scrolledBy: amount, scrollY };
  } finally {
    // Disconnect client only — do NOT call browser.close() (kills browser via CDP)
  }
}

async function cmdResize(args) {
  const width = parseInt(args[0], 10);
  const height = parseInt(args[1], 10);
  if (!width || !height) return { error: 'Usage: resize <width> <height>' };

  const { browser, page } = await getPage();
  try {
    await page.setViewportSize({ width, height });
    return { status: 'ok', viewport: { width, height } };
  } finally {
    // Disconnect client only — do NOT call browser.close() (kills browser via CDP)
  }
}

async function cmdSnapshot() {
  const { browser, page } = await getPage();
  try {
    const snapshot = await page.evaluate(() => {
      const walk = (el, depth = 0) => {
        const lines = [];
        const tag = el.tagName?.toLowerCase() || '';
        const role = el.getAttribute?.('role') || '';
        const text = el.childNodes.length === 1 && el.childNodes[0].nodeType === 3
          ? el.textContent.trim().slice(0, 100)
          : '';
        const indent = '  '.repeat(depth);
        if (tag) {
          const label = role ? `[${role}]` : tag;
          lines.push(`${indent}${label}${text ? ': ' + text : ''}`);
        }
        for (const child of el.children || []) {
          lines.push(...walk(child, depth + 1));
        }
        return lines;
      };
      return walk(document.body).join('\n');
    });

    const maxLen = 30000;
    const truncated = snapshot.length > maxLen;
    return {
      status: 'ok',
      snapshot: truncated ? snapshot.slice(0, maxLen) + '\n... [truncated]' : snapshot,
      truncated,
      length: snapshot.length,
    };
  } finally {
    // Disconnect client only — do NOT call browser.close() (kills browser via CDP)
  }
}

async function cmdStop() {
  // Try graceful close via CDP first
  try {
    const browser = await chromium.connectOverCDP(`http://127.0.0.1:${CDP_PORT}`);
    await browser.close();
  } catch {}

  // Kill by PID
  const state = readState();
  if (state?.pid) {
    try { process.kill(state.pid, 'SIGTERM'); } catch {}
  }

  // Kill by port as fallback
  try { execSync(`lsof -ti:${CDP_PORT} | xargs kill -9 2>/dev/null`, { stdio: 'ignore' }); } catch {}
  clearState();
  return { status: 'ok', message: 'Browser stopped' };
}

// --- Main ---

async function main() {
  const [command, ...args] = process.argv.slice(2);

  if (!command || command === '--help') {
    console.log(`Usage: node inspect.js <command> [args]

Commands:
  start [--viewport WxH]       Launch browser (reuses if running)
  navigate <url>               Navigate to URL
  screenshot [--path f] [--full-page]  Take screenshot
  eval "<js>"                  Execute JavaScript in page
  click "<selector>"           Click element
  hover "<selector>"           Hover element
  scroll [amount]              Scroll page (default 500px)
  resize <width> <height>      Resize viewport
  snapshot                     Get page content tree
  stop                         Kill browser and clean up

CDP Port: ${CDP_PORT} (avoids conflict with dev-extract.js on 9222)`);
    process.exit(0);
  }

  const commands = {
    start: cmdStart,
    navigate: cmdNavigate,
    screenshot: cmdScreenshot,
    eval: cmdEval,
    click: cmdClick,
    hover: cmdHover,
    scroll: cmdScroll,
    resize: cmdResize,
    snapshot: cmdSnapshot,
    stop: cmdStop,
  };

  const fn = commands[command];
  if (!fn) {
    console.log(JSON.stringify({ error: `Unknown command: ${command}` }));
    process.exit(1);
  }

  try {
    const result = await fn(args);
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.log(JSON.stringify({ error: err.message, command }));
    process.exit(1);
  }

  process.exit(0);
}

main();
