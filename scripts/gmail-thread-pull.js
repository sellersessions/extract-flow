// Pull a Gmail thread via Playwright CDP attach.
// Usage: node gmail-thread-pull.js <thread-subject-snippet> [output-path]

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const CDP_URL = 'http://localhost:9334';
const SUBJECT_SNIPPET = process.argv[2] || 'Correspondence for your Attention 18.05.26';
const OUT_PATH = process.argv[3] || '/tmp/gmail-thread.json';

(async () => {
  const browser = await chromium.connectOverCDP(CDP_URL);
  const contexts = browser.contexts();
  const context = contexts[0];
  const pages = context.pages();
  console.log(`Found ${pages.length} pages.`);
  let page = pages.find(p => /mail\.google\.com/.test(p.url()));
  if (!page) {
    console.error('No mail.google.com tab found. Open Gmail first.');
    process.exit(1);
  }
  console.log(`Using page: ${page.url()}`);

  // Search for the subject so we land on the thread list
  await page.bringToFront();
  await page.waitForLoadState('domcontentloaded');

  // Try the search box — find any [aria-label*="Search mail"]
  const searchBox = await page.locator('input[aria-label*="Search mail" i]').first();
  if (await searchBox.count() === 0) {
    console.error('Search box not found.');
    process.exit(1);
  }
  await searchBox.click();
  await searchBox.fill('');
  await searchBox.fill(`subject:"${SUBJECT_SNIPPET}"`);
  await page.keyboard.press('Enter');
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1500);

  // Click the first thread in results
  const firstRow = await page.locator('tr.zA').first();
  if (await firstRow.count() === 0) {
    console.error('No threads found in search results.');
    process.exit(1);
  }
  await firstRow.click();
  await page.waitForTimeout(2000);

  // Expand-all if the "expand all" button exists
  try {
    const expandAll = await page.locator('[aria-label*="Expand all" i]').first();
    if (await expandAll.count() > 0) {
      await expandAll.click();
      await page.waitForTimeout(1000);
    }
  } catch (e) {}

  // Extract every message in the thread
  const messages = await page.evaluate(() => {
    const out = [];
    // Gmail message containers usually have class h7N-n or role="listitem" parent
    const msgNodes = document.querySelectorAll('div[role="listitem"], div.adn.ads');
    const seen = new Set();
    msgNodes.forEach(node => {
      // skip if too small (collapsed inline replies, etc.)
      if (node.textContent.length < 30) return;
      // Try to extract sender / date / body
      const fromEl = node.querySelector('.gD, [email]');
      const dateEl = node.querySelector('span.g3, span[title*=":" i]');
      const bodyEl = node.querySelector('.a3s, .ii.gt div, .ii.gt');
      const fromName = fromEl ? (fromEl.getAttribute('name') || fromEl.textContent || '').trim() : '';
      const fromEmail = fromEl ? (fromEl.getAttribute('email') || '').trim() : '';
      const date = dateEl ? (dateEl.getAttribute('title') || dateEl.textContent || '').trim() : '';
      const body = bodyEl ? (bodyEl.innerText || bodyEl.textContent || '').trim() : '';
      if (!body || body.length < 20) return;
      const key = (fromEmail || fromName) + '|' + date.slice(0, 30) + '|' + body.slice(0, 80);
      if (seen.has(key)) return;
      seen.add(key);
      out.push({
        from_name: fromName,
        from_email: fromEmail,
        date,
        body,
      });
    });
    // Subject from page
    const subjectEl = document.querySelector('h2.hP') || document.querySelector('[data-thread-perm-id] h2');
    const subject = subjectEl ? subjectEl.textContent.trim() : '';
    return { subject, messages: out };
  });

  fs.writeFileSync(OUT_PATH, JSON.stringify(messages, null, 2));
  console.log(`Saved ${messages.messages.length} messages to ${OUT_PATH}`);
  console.log(`Subject: ${messages.subject}`);

  await browser.close();
})().catch(err => {
  console.error('FAILED:', err.message);
  process.exit(1);
});
