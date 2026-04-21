import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const contexts = browser.contexts();
  console.log(`Connected. ${contexts.length} contexts, ${contexts.reduce((n, c) => n + c.pages().length, 0)} pages`);
  
  // Find the TikTok tab
  let page = null;
  for (const ctx of contexts) {
    for (const p of ctx.pages()) {
      if (p.url().includes('tiktok.com')) {
        page = p;
        break;
      }
    }
  }
  
  if (!page) {
    page = await contexts[0].newPage();
  }
  
  console.log('Current TikTok tab:', page.url());
  
  // Navigate to the profile page
  await page.goto('https://www.tiktok.com/@sellersessions', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(e => console.log('Nav warning:', e.message));
  await page.waitForTimeout(3000);
  
  const title = await page.title();
  console.log(`Title: ${title}`);
  console.log(`URL: ${page.url()}`);
  
  // Check page state - login, tabs available, video links
  const pageInfo = await page.evaluate(() => {
    // Find all tab-like elements
    const tabs = Array.from(document.querySelectorAll('[role="tab"], [data-e2e*="tab"], a[href*="tab="]')).map(el => ({
      text: el.textContent?.trim()?.slice(0, 30),
      href: el.getAttribute('href') || '',
      ariaSelected: el.getAttribute('aria-selected')
    }));
    
    // Find video links
    const videoLinks = Array.from(document.querySelectorAll('a[href*="/video/"]')).map(a => a.href);
    
    // Find photo links
    const photoLinks = Array.from(document.querySelectorAll('a[href*="/photo/"]')).map(a => a.href);
    
    // Check login state
    const hasAvatar = !!document.querySelector('[data-e2e="profile-icon"]');
    const bodySnippet = document.body?.innerText?.slice(0, 500) || '';
    
    return {
      tabs,
      videoCount: videoLinks.length,
      videoSample: videoLinks.slice(0, 5),
      photoCount: photoLinks.length,
      photoSample: photoLinks.slice(0, 5),
      hasAvatar,
      bodySnippet: bodySnippet.slice(0, 300)
    };
  });
  
  console.log(JSON.stringify(pageInfo, null, 2));
  
  // Don't close - leave the browser connected
  await browser.close();
}

run().catch(e => { console.error(e.message); process.exit(1); });
