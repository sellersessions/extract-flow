// Batch convert all .md files under a root folder to .pdf alongside each.
// Uses marked for markdown → HTML, Playwright chromium for HTML → PDF with print-media emulation.
//
// Usage: node md-to-pdf-batch.mjs "/path/to/root/folder"
//
// Output: for each foo.md → writes foo.pdf in the same directory.
// The .md files are left untouched.

import fs from 'fs';
import path from 'path';
import { marked } from 'marked';
import { chromium } from 'playwright';

const ROOT = process.argv[2];
if (!ROOT) { console.error('Usage: node md-to-pdf-batch.mjs <root-folder>'); process.exit(1); }

// Walk + collect .md files
function findMd(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.DS_Store') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...findMd(full));
    else if (entry.name.toLowerCase().endsWith('.md')) out.push(full);
  }
  return out;
}

const HTML_CSS = `
<style>
  @page { size: A4; margin: 22mm 18mm 22mm 18mm; }
  body { font-family: -apple-system, "SF Pro Text", Helvetica, Arial, sans-serif;
         font-size: 11pt; line-height: 1.55; color: #1a1d24; max-width: 100%; }
  h1 { font-size: 22pt; color: #4A2D7A; margin: 0 0 14pt 0; border-bottom: 2px solid #4A2D7A; padding-bottom: 8pt; }
  h2 { font-size: 14pt; color: #4A2D7A; margin: 18pt 0 8pt 0; }
  h3 { font-size: 12pt; color: #1a1d24; margin: 14pt 0 6pt 0; font-weight: 600; }
  p { margin: 6pt 0; }
  ul, ol { margin: 6pt 0 6pt 20pt; padding: 0; }
  li { margin: 3pt 0; }
  code { background: #f6f7f9; padding: 1pt 4pt; border-radius: 3px; font-family: "SF Mono", Menlo, monospace; font-size: 10pt; }
  pre { background: #f6f7f9; padding: 10pt; border-radius: 6px; overflow-x: auto; font-size: 9pt; line-height: 1.4; }
  pre code { background: none; padding: 0; }
  blockquote { border-left: 3px solid #4A2D7A; padding: 4pt 12pt; margin: 8pt 0; color: #555;
               background: #f8f6fc; font-style: normal; }
  table { border-collapse: collapse; margin: 8pt 0; width: 100%; font-size: 10pt; }
  th, td { border: 1px solid #d0d4da; padding: 5pt 8pt; text-align: left; vertical-align: top; }
  th { background: #f6f7f9; font-weight: 600; }
  hr { border: none; border-top: 1px solid #d0d4da; margin: 16pt 0; }
  img { max-width: 100%; height: auto; margin: 8pt 0; border: 1px solid #e3e6ec; border-radius: 4px; page-break-inside: avoid; }
  a { color: #4A2D7A; text-decoration: none; }
  strong { font-weight: 600; }
</style>`;

function wrapHtml(title, body) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>${HTML_CSS}</head><body>${body}</body></html>`;
}

const mdFiles = findMd(ROOT);
console.log(`Found ${mdFiles.length} markdown files`);
mdFiles.forEach(f => console.log('  ' + f.replace(ROOT, '...')));

const browser = await chromium.launch();
const ctx = await browser.newContext();

let ok = 0, fail = 0;
for (const md of mdFiles) {
  try {
    const content = fs.readFileSync(md, 'utf-8');
    const html = marked.parse(content);
    const dir = path.dirname(md);
    const base = path.basename(md, '.md');
    const htmlPath = path.join(dir, `_tmp_${base}.html`);
    const pdfPath = path.join(dir, `${base}.pdf`);
    fs.writeFileSync(htmlPath, wrapHtml(base, html));

    const page = await ctx.newPage();
    await page.goto('file://' + htmlPath, { waitUntil: 'networkidle' });
    await page.emulateMedia({ media: 'print' });
    await page.pdf({ path: pdfPath, format: 'A4', printBackground: true,
                     margin: { top: '20mm', bottom: '20mm', left: '18mm', right: '18mm' } });
    await page.close();

    fs.unlinkSync(htmlPath);
    const kb = (fs.statSync(pdfPath).size / 1024).toFixed(1);
    console.log(`  ✓ ${base}.pdf (${kb} KB)`);
    ok++;
  } catch (e) {
    console.error(`  ✗ ${md}: ${e.message}`);
    fail++;
  }
}

await browser.close();
console.log(`\nDone: ${ok} succeeded, ${fail} failed`);
