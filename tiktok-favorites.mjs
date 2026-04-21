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
  
  console.log('On:', page.url());
  
  // Click the Favorites tab
  const favTab = await page.locator('[role="tab"]:has-text("Favorites")').first();
  await favTab.click();
  console.log('Clicked Favorites tab');
  await page.waitForTimeout(3000);
  
  // Now scroll down to load more content, and collect URLs
  let allUrls = new Set();
  let lastCount = 0;
  let stableRounds = 0;
  
  for (let scroll = 0; scroll < 30; scroll++) {
    const urls = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="/video/"], a[href*="/photo/"]'));
      return links.map(a => a.href);
    });
    
    urls.forEach(u => allUrls.add(u));
    
    if (allUrls.size === lastCount) {
      stableRounds++;
      if (stableRounds >= 3) {
        console.log(`Stable at ${allUrls.size} URLs after ${scroll + 1} scrolls`);
        break;
      }
    } else {
      stableRounds = 0;
    }
    lastCount = allUrls.size;
    console.log(`Scroll ${scroll + 1}: ${allUrls.size} URLs found`);
    
    // Scroll down
    await page.evaluate(() => window.scrollBy(0, 1500));
    await page.waitForTimeout(1500);
  }
  
  const sorted = [...allUrls].sort();
  console.log(`\n=== TOTAL: ${sorted.length} URLs ===\n`);
  sorted.forEach((u, i) => console.log(`${i + 1}. ${u}`));
  
  await browser.close();
}

run().catch(e => { console.error(e.message); process.exit(1); });
