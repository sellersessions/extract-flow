"""Template: Multi-page workflow with UC Mode.

Usage: Copy to generated/, customise STEPS list.
Each step = navigate + extract. Results collected into single JSON.
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))
from config import PROFILE_DIR, CHROME_BINARY, UC_MODE, HEADLESS, PAGE_LOAD_TIMEOUT

from seleniumbase import SB

# === CUSTOMISE THESE ===
STEPS = [
    {
        "url": "https://example.com/page-1",
        "extract": {"title": "h1", "price": ".price"},
    },
    {
        "url": "https://example.com/page-2",
        "extract": {"title": "h1", "price": ".price"},
    },
]
# === END CUSTOMISE ===


def extract_fields(sb, fields: dict) -> dict:
    """Extract text from selectors."""
    data = {}
    for key, selector in fields.items():
        if sb.is_element_present(selector):
            data[key] = sb.get_text(selector)
        else:
            data[key] = None
    return data


def run():
    with SB(
        uc=UC_MODE,
        headless=HEADLESS,
        user_data_dir=str(PROFILE_DIR),
        browser="chrome",
        binary_location=CHROME_BINARY,
    ) as sb:
        results = []
        for i, step in enumerate(STEPS):
            sb.open(step["url"])
            sb.sleep(3)

            data = extract_fields(sb, step.get("extract", {}))
            results.append({
                "step": i + 1,
                "url": sb.get_current_url(),
                "data": data,
            })

        output = {
            "status": "ok",
            "steps_completed": len(results),
            "steps_total": len(STEPS),
            "results": results,
        }
        print(json.dumps(output))


if __name__ == "__main__":
    run()
