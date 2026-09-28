"""Browser fixtures for the Selenium end-to-end suite.

These drive a real Chromium against a running Vite dev server, which is why
they live outside ``backend/tests/``: that directory's ``conftest.py`` carries a
session-scoped autouse fixture that runs ``alembic upgrade head`` against
Postgres, which a UI smoke test has no business needing.

Run them from the repo root::

    python -m venv e2e/.venv
    e2e/.venv/bin/pip install -r e2e/requirements.txt
    (cd frontend && npm run dev)      # serves http://localhost:5173
    pytest e2e

Point them somewhere else with ``E2E_BASE_URL`` -- e.g. to smoke-test the
docker compose stack instead of the dev server. Every knob is an env var so
CI can override it without editing this file.
"""
import os
import shutil
import urllib.error
import urllib.request

import pytest
import selenium
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service

DEFAULT_BASE_URL = "http://localhost:5173"

# Desktop width on purpose: village.css collapses the sidebar to a single
# column below 700px, and headless Chromium otherwise opens at 800x600.
WINDOW_SIZE = (1440, 900)


def _flag(name, default):
    """Read a boolean-ish env var, so CI can flip behaviour without code edits."""
    return os.environ.get(name, default).strip().lower() not in ("0", "false", "no")


def _find_chrome_binary():
    """Prefer the distro chromium; Selenium Manager only looks for google-chrome."""
    explicit = os.environ.get("E2E_BROWSER_BINARY")
    if explicit:
        return explicit
    for name in ("chromium", "chromium-browser", "google-chrome", "chrome"):
        found = shutil.which(name)
        if found:
            return found
    return None


def _server_is_up(url, timeout=2.0):
    try:
        with urllib.request.urlopen(url, timeout=timeout) as response:
            return response.status < 500
    except urllib.error.HTTPError as exc:
        return exc.code < 500
    except OSError:
        return False


@pytest.fixture(scope="session")
def base_url():
    url = os.environ.get("E2E_BASE_URL", DEFAULT_BASE_URL).rstrip("/")
    if _server_is_up(url):
        return url
    # An explicit E2E_BASE_URL means someone meant it -- a dead server there is
    # a failure worth seeing. The implicit localhost default just means the
    # suite wasn't set up yet, which is a skip.
    if "E2E_BASE_URL" in os.environ:
        pytest.fail(f"E2E_BASE_URL={url} is not reachable -- is the app running?")
    pytest.skip(
        f"No frontend at {url}. Start it with `cd frontend && npm run dev`, "
        "or set E2E_BASE_URL to point at a running instance."
    )


@pytest.fixture(scope="session")
def driver(base_url):
    options = Options()

    binary = _find_chrome_binary()
    if binary:
        options.binary_location = binary
    for argument in (
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        # Phaser wants WebGL; without this the page falls back to software
        # rendering and logs a deprecation on every village/war-map load.
        "--enable-unsafe-swiftshader",
    ):
        options.add_argument(argument)
    options.add_argument(f"--window-size={WINDOW_SIZE[0]},{WINDOW_SIZE[1]}")

    # Surfaces "Outdated Optimize Dep" and similar 504s as test failures
    # instead of a mystery blank page.
    options.set_capability("goog:loggingPrefs", {"browser": "ALL"})

    driver_path = os.environ.get("E2E_CHROMEDRIVER") or shutil.which("chromedriver")
    service = Service(executable_path=driver_path) if driver_path else Service()

    print(f"\ne2e: selenium {selenium.__version__} -> {binary or 'auto'} @ {base_url}")
    session = webdriver.Chrome(service=service, options=options)
    try:
        session.set_window_size(*WINDOW_SIZE)
        yield session
    finally:
        session.quit()


@pytest.fixture(autouse=True)
def clean_browser_state(driver, base_url):
    """Start every test logged out with empty storage.

    Tokens live in localStorage (shared/api/client.js), which survives between
    tests in the same browser session -- without this, test order would decide
    who is authenticated.
    """
    driver.get(base_url)
    driver.delete_all_cookies()
    driver.execute_script(
        "window.localStorage.clear(); window.sessionStorage.clear();"
    )
    yield
