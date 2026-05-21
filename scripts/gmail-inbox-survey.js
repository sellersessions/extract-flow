// Survey inbox threads matching a query — just the list, no body extraction.
// Usage: node gmail-inbox-survey.js <search-query>
const { chromium } = require('playwright');

const CDP_URL = 'http://localhost:9334';
const QUERY = process.argv[2] || 'hannah@moloneyfamilylaw.com';

(async () => {
  const browser = await chromium.connectOverCDP(CDP_URL);
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  const page = pages.find(p => /mail\.google\.com/.test(p.url()));
  if (!page) { console.error('No gmail page'); process.exit(1); }
  await page.bringToFront();
  // Navigate directly to a search URL — works whether or not a thread is open
  const encoded = encodeURIComponent(QUERY);
  await page.goto(`https://mail.google.com/mail/u/1/#search/${encoded}`);
  await page.waitForTimeout(3500);

  const rows = await page.evaluate(() => {
    const out = [];
    const trs = document.querySelectorAll('tr.zA');
    trs.forEach(tr => {
      const subjEl = tr.querySelector('.bog, .y6');
      const fromEl = tr.querySelector('.yX.xY, [email]');
      const dateEl = tr.querySelector('.xW span, td.xW');
      const previewEl = tr.querySelector('.y2');
      out.push({
        from: fromEl ? (fromEl.textContent || '').trim().slice(0, 80) : '',
        subject: subjEl ? (subjEl.textContent || '').trim().slice(0, 120) : '',
        preview: previewEl ? (previewEl.textContent || '').trim().slice(0, 100) : '',
        date: dateEl ? (dateEl.textContent || '').trim().slice(0, 30) : '',
      });
    });
    return out;
  });

  console.log(`Query: ${QUERY}`);
  console.log(`Results: ${rows.length}`);
  console.log();
  rows.forEach((r, i) => {
    console.log(`${i+1}. [${r.date}] ${r.from}`);
    console.log(`   Subject: ${r.subject}`);
    console.log(`   Preview: ${r.preview}`);
    console.log();
  });

  await browser.close();
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
