"""Template: Form automation with UC Mode.

Usage: Copy to generated/, customise FORM_URL, FIELDS, and SUBMIT_SELECTOR.
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))
from config import PROFILE_DIR, CHROME_BINARY, UC_MODE, HEADLESS, PAGE_LOAD_TIMEOUT

from seleniumbase import SB

# === CUSTOMISE THESE ===
FORM_URL = "https://example.com/form"
FIELDS = {
    "#name": "Danny McMillan",
    "#email": "danny@example.com",
    "#message": "Automated form submission",
}
SUBMIT_SELECTOR = "button[type='submit']"
SUCCESS_INDICATOR = ".success-message"
# === END CUSTOMISE ===


def run():
    with SB(
        uc=UC_MODE,
        headless=HEADLESS,
        user_data_dir=str(PROFILE_DIR),
        browser="chrome",
        binary_location=CHROME_BINARY,
    ) as sb:
        sb.open(FORM_URL)
        sb.sleep(2)

        # Fill fields
        for selector, value in FIELDS.items():
            if sb.is_element_present(selector):
                sb.type(selector, value)
            else:
                print(json.dumps({
                    "status": "error",
                    "error": f"Field not found: {selector}",
                    "url": sb.get_current_url(),
                }))
                return

        # Submit
        sb.click(SUBMIT_SELECTOR)
        sb.sleep(3)

        if sb.is_element_present(SUCCESS_INDICATOR):
            result = {
                "status": "ok",
                "action": "form_submitted",
                "url": sb.get_current_url(),
            }
        else:
            result = {
                "status": "uncertain",
                "action": "form_submitted_no_confirmation",
                "url": sb.get_current_url(),
            }

        print(json.dumps(result))


if __name__ == "__main__":
    run()
