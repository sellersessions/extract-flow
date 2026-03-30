"""Template: Auth flow with UC Mode + persistent profile.

Usage: Copy to generated/, customise LOGIN_URL, SELECTORS, CREDENTIALS.
The persistent profile means you only need to log in once --
subsequent runs reuse the saved session cookies.
"""

import json
import sys
from pathlib import Path

# Add parent dirs so config is importable
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))
from config import PROFILE_DIR, CHROME_BINARY, UC_MODE, HEADLESS, PAGE_LOAD_TIMEOUT

from seleniumbase import SB

# === CUSTOMISE THESE ===
LOGIN_URL = "https://example.com/login"
DASHBOARD_URL = "https://example.com/dashboard"
SELECTORS = {
    "username": "#username",
    "password": "#password",
    "submit": "button[type='submit']",
    "logged_in_indicator": ".dashboard-header",
}
# Credentials: use env vars in production, never hardcode
import os
USERNAME = os.environ.get("AUTH_USERNAME", "")
PASSWORD = os.environ.get("AUTH_PASSWORD", "")
# === END CUSTOMISE ===


def run():
    with SB(
        uc=UC_MODE,
        headless=HEADLESS,
        user_data_dir=str(PROFILE_DIR),
        browser="chrome",
        binary_location=CHROME_BINARY,
    ) as sb:
        sb.open(DASHBOARD_URL)
        sb.sleep(2)

        # Check if already logged in (persistent profile has session)
        if sb.is_element_present(SELECTORS["logged_in_indicator"]):
            result = {"status": "already_authenticated", "url": sb.get_current_url()}
            print(json.dumps(result))
            return

        # Not logged in -- perform auth flow
        sb.open(LOGIN_URL)
        sb.sleep(2)
        sb.type(SELECTORS["username"], USERNAME)
        sb.type(SELECTORS["password"], PASSWORD)
        sb.click(SELECTORS["submit"])
        sb.sleep(3)

        if sb.is_element_present(SELECTORS["logged_in_indicator"]):
            result = {"status": "login_success", "url": sb.get_current_url()}
        else:
            result = {"status": "login_failed", "url": sb.get_current_url()}

        print(json.dumps(result))


if __name__ == "__main__":
    run()
