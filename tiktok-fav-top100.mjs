import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const contexts = browser.contexts();
  
  let page = null;
  for (const ctx of contexts) {
    for (const p of ctx.pages()) {
      if (p.url().includes('tiktok.com')) { page = p; break; }
    }
  }
  if (!page) throw new Error('No TikTok tab found');
  
  // Scroll back to top first
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1000);
  
  // Make sure we're on the Favorites tab
  const favTab = await page.locator('[role="tab"]:has-text("Favorites")').first();
  await favTab.click();
  await page.waitForTimeout(3000);
  
  // Scroll to top again after tab switch
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1000);
  
  // Collect URLs in DOM order (which is recency order on TikTok)
  // Use a Set that preserves insertion order, deduped
  let orderedUrls = [];
  let seen = new Set();
  
  for (let scroll = 0; scroll < 15; scroll++) {
    const urls = await page.evaluate(() => {
      // Get all video/photo links in DOM order
      const links = Array.from(document.querySelectorAll('a[href*="/video/"], a[href*="/photo/"]'));
      return links.map(a => a.href);
    });
    
    for (const u of urls) {
      if (!seen.has(u)) {
        seen.add(u);
        orderedUrls.push(u);
      }
    }
    
    if (orderedUrls.length >= 100) {
      console.log(`Got ${orderedUrls.length} after ${scroll + 1} scrolls — enough`);
      break;
    }
    
    console.log(`Scroll ${scroll + 1}: ${orderedUrls.length} URLs`);
    await page.evaluate(() => window.scrollBy(0, 1200));
    await page.waitForTimeout(1500);
  }
  
  // Take just the first 100
  const top100 = orderedUrls.slice(0, 100);
  console.log(`\n=== TOP 100 FAVORITES (most recent first) ===\n`);
  top100.forEach((u, i) => console.log(`${i + 1}. ${u}`));
  
  await browser.close();
}

run().catch(e => { console.error(e.message); process.exit(1); });
