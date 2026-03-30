"""Template: Single page scrape with UC Mode.

Usage: Copy to generated/, customise TARGET_URL and EXTRACTION logic.
Outputs structured JSON to stdout (runner.py captures it).
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))
from config import PROFILE_DIR, CHROME_BINARY, UC_MODE, HEADLESS, PAGE_LOAD_TIMEOUT

from seleniumbase import SB

# === CUSTOMISE THESE ===
TARGET_URL = "https://example.com/product-page"
# === END CUSTOMISE ===


def run():
    with SB(
        uc=UC_MODE,
        headless=HEADLESS,
        user_data_dir=str(PROFILE_DIR),
        browser="chrome",
        binary_location=CHROME_BINARY,
    ) as sb:
        sb.open(TARGET_URL)
        sb.sleep(3)  # Let anti-bot checks pass

        # === CUSTOMISE EXTRACTION ===
        title = sb.get_text("h1") if sb.is_element_present("h1") else ""
        page_url = sb.get_current_url()
        page_title = sb.get_title()

        # Example: extract all links
        links = []
        if sb.is_element_present("a"):
            elements = sb.find_elements("a")
            for el in elements[:50]:  # Cap at 50 to avoid huge output
                href = el.get_attribute("href") or ""
                text = el.text.strip()
                if href and text:
                    links.append({"text": text, "href": href})

        result = {
            "status": "ok",
            "url": page_url,
            "page_title": page_title,
            "h1": title,
            "links_found": len(links),
            "links": links,
        }
        # === END CUSTOMISE ===

        print(json.dumps(result))


if __name__ == "__main__":
    run()
