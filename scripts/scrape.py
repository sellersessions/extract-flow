#!/usr/bin/env python3
"""
Tier 1: Fast HTTP extraction with Cloudflare bypass.

Uses cloudscraper25 + BeautifulSoup for lightweight, token-efficient
web scraping. No browser needed — pure HTTP with JS challenge solving.

Usage:
    python3 scrape.py --url https://example.com
    python3 scrape.py --url https://example.com --exclude "nav,footer,.cookie-banner"
    python3 scrape.py --url https://example.com --selectors '{"prices": ".price", "titles": "h2.product-title"}'
    python3 scrape.py --url https://example.com --format text

Returns JSON to stdout. On failure, returns {"fallback": "playwright", "error": "..."}.
"""

import argparse
import json
import sys
import time

try:
    from cloudscraper25 import create_scraper
except ImportError:
    from cloudscraper import create_scraper

from bs4 import BeautifulSoup

MAX_OUTPUT_BYTES = 50_000
MAX_RETRIES = 3


def parse_args():
    p = argparse.ArgumentParser(description="Tier 1: Fast HTTP extraction")
    p.add_argument("--url", required=True, help="Target URL")
    p.add_argument("--selectors", default=None,
                   help='JSON object of named CSS selectors, e.g. \'{"prices": ".price"}\'')
    p.add_argument("--exclude", default=None,
                   help="Comma-separated CSS selectors to strip before extraction")
    p.add_argument("--format", default="json", choices=["json", "text", "html"],
                   help="Output format (default: json)")
    p.add_argument("--timeout", type=int, default=15, help="Request timeout in seconds")
    return p.parse_args()


def fetch_with_retry(scraper, url, timeout):
    last_error = None
    for attempt in range(MAX_RETRIES):
        try:
            resp = scraper.get(url, timeout=timeout)
            if resp.status_code == 200:
                return resp
            if resp.status_code in (403, 429, 503):
                last_error = f"HTTP {resp.status_code}"
                time.sleep(2 ** attempt)
                continue
            return resp
        except Exception as e:
            last_error = str(e)
            time.sleep(2 ** attempt)
    return last_error


def extract_tables(soup):
    tables = []
    for table in soup.find_all("table"):
        headers = [th.get_text(strip=True) for th in table.find_all("th")]
        rows = []
        for tr in table.find_all("tr"):
            cells = [td.get_text(strip=True) for td in tr.find_all(["td"])]
            if cells:
                rows.append(cells)
        tables.append({"headers": headers, "rows": rows})
    return tables


def extract_meta(soup):
    meta = {}
    for tag in soup.find_all("meta"):
        name = tag.get("name") or tag.get("property") or ""
        content = tag.get("content", "")
        if name and content:
            meta[name] = content
    return meta


def extract_links(soup):
    links = []
    for a in soup.find_all("a", href=True):
        text = a.get_text(strip=True)
        href = a["href"]
        if href and not href.startswith(("#", "javascript:")):
            links.append({"text": text, "href": href})
    return links


def main():
    args = parse_args()
    scraper = create_scraper(browser={"browser": "chrome", "platform": "darwin"})

    result = fetch_with_retry(scraper, args.url, args.timeout)

    if isinstance(result, str):
        json.dump({"fallback": "playwright", "error": result, "url": args.url}, sys.stdout)
        sys.exit(1)

    if result.status_code != 200:
        json.dump({
            "fallback": "playwright",
            "error": f"HTTP {result.status_code}",
            "url": args.url
        }, sys.stdout)
        sys.exit(1)

    soup = BeautifulSoup(result.text, "html.parser")

    # Strip excluded elements
    if args.exclude:
        for selector in args.exclude.split(","):
            selector = selector.strip()
            if selector:
                for el in soup.select(selector):
                    el.decompose()

    # Raw HTML output
    if args.format == "html":
        out = str(soup)
        if len(out.encode()) > MAX_OUTPUT_BYTES:
            out = out[:MAX_OUTPUT_BYTES] + "\n... [truncated]"
        print(out)
        return

    # Text-only output
    if args.format == "text":
        text = soup.get_text(separator="\n", strip=True)
        if len(text.encode()) > MAX_OUTPUT_BYTES:
            text = text[:MAX_OUTPUT_BYTES] + "\n... [truncated]"
        print(text)
        return

    # JSON output
    title = soup.title.get_text(strip=True) if soup.title else ""
    content = soup.get_text(separator="\n", strip=True)

    output = {
        "url": args.url,
        "title": title,
        "meta": extract_meta(soup),
        "content": content,
        "links": extract_links(soup),
        "tables": extract_tables(soup),
    }

    # Custom selectors
    if args.selectors:
        try:
            selectors = json.loads(args.selectors)
            custom = {}
            for name, sel in selectors.items():
                elements = soup.select(sel)
                custom[name] = [el.get_text(strip=True) for el in elements]
            output["custom"] = custom
        except (json.JSONDecodeError, Exception) as e:
            output["selector_error"] = str(e)

    # Truncate content if too large
    raw = json.dumps(output)
    if len(raw.encode()) > MAX_OUTPUT_BYTES:
        # Truncate content field to fit
        over = len(raw.encode()) - MAX_OUTPUT_BYTES
        output["content"] = output["content"][:-(over + 100)] + "\n... [truncated]"
        output["truncated"] = True

    json.dump(output, sys.stdout, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()
