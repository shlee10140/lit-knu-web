"""Run browser UI smoke checks with Python Playwright.
LIT_TEST_URL defaults to http://127.0.0.1:5173 or https://litmsa.knulit.kro.kr.
"""
import os
from pathlib import Path

URL = os.environ.get('LIT_TEST_URL', 'https://litmsa.knulit.kro.kr')
OUT = Path('/tmp/lit-browser-checks')
OUT.mkdir(exist_ok=True)

def run_tests():
    try:
        from playwright.sync_api import sync_playwright, expect
    except ImportError:
        print("Playwright is not installed in the python environment. Use Node.js test suite.")
        return

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 720})
        page = context.new_page()
        page.goto(URL)
        page.wait_for_load_state('networkidle')

        # Check title & main sections
        assert 'LIT' in page.title()
        print("PASS: Page loaded successfully")
        browser.close()

if __name__ == '__main__':
    run_tests()
