"""Selenium E2E tests for Codeforge authentication.

Student: Niranjan R Soorej
Roll No: 2024BCS0117

Tests:
    TC-SEL-01 - Protected route redirects anonymous users
    TC-SEL-02 - Invalid login is rejected (negative test)
"""

import os
import urllib.parse

import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


pytestmark = pytest.mark.e2e

WAIT_SECONDS = float(os.environ.get("E2E_TIMEOUT", "10"))

EMAIL_INPUT = 'input[autocomplete="email"]'
PASSWORD_INPUT = 'input[autocomplete="current-password"]'
SUBMIT_BUTTON = '//form//button[@type="submit"]'
ERROR_ALERT = '//p[@role="alert"]'
HEADER_SIGN_IN = '//header//a[normalize-space()="Sign in"]'

AUTHED_NAV_LABELS = (
    "Village",
    "War Map",
    "Guild",
    "Season",
    "Events",
)

ROLL_NO = "2024BCS0117"


def _wait(driver, by, value):
    """Wait until an element is present and return it."""
    return WebDriverWait(driver, WAIT_SECONDS).until(
        EC.presence_of_element_located((by, value))
    )


def _current_path(driver):
    """Return only the path portion of the current URL."""
    return urllib.parse.urlparse(driver.current_url).path


def _header_nav_link_present(driver, label):
    """Check whether an authenticated navigation link is visible."""
    xpath = f'//header//nav//a[normalize-space()="{label}"]'
    return len(driver.find_elements(By.XPATH, xpath)) > 0


def test_tc_sel_01_protected_route_redirects_anonymous_user(
    driver,
    base_url,
):
    """TC-SEL-01: Anonymous users cannot access protected routes."""

    # Attempt to access a protected page without authentication.
    driver.get(f"{base_url}/village")

    # The application should redirect the visitor to /login.
    WebDriverWait(driver, WAIT_SECONDS).until(
        EC.url_contains("/login")
    )

    assert _current_path(driver) == "/login"

    # Verify that the login page actually rendered.
    assert _wait(
        driver,
        By.CSS_SELECTOR,
        "h1",
    ).text == "CODEFORGE"

    assert _wait(
        driver,
        By.CSS_SELECTOR,
        EMAIL_INPUT,
    ).is_displayed()

    assert _wait(
        driver,
        By.CSS_SELECTOR,
        PASSWORD_INPUT,
    ).is_displayed()

    assert _wait(
        driver,
        By.XPATH,
        SUBMIT_BUTTON,
    ).is_displayed()

    # Anonymous users should see the Sign in link.
    assert _wait(
        driver,
        By.XPATH,
        HEADER_SIGN_IN,
    ).is_displayed()

    # Authenticated navigation must not be visible.
    for label in AUTHED_NAV_LABELS:
        assert not _header_nav_link_present(
            driver,
            label,
        ), f"{label!r} nav link is visible to anonymous visitor"

    # Save execution screenshot for the assignment report.
    driver.save_screenshot(
        "TC-SEL-01-protected-route.png"
    )


def test_tc_sel_02_invalid_login_rejected(
    driver,
    base_url,
):
    """TC-SEL-02: Invalid credentials must be rejected.

    Negative test:
    The user deliberately provides invalid credentials.
    """

    driver.get(f"{base_url}/login")

    # Student-specific test data.
    invalid_email = f"nobody_{ROLL_NO}@codeforge.test"
    invalid_password = f"wrong-password-{ROLL_NO}"

    # Enter invalid email.
    _wait(
        driver,
        By.CSS_SELECTOR,
        EMAIL_INPUT,
    ).send_keys(invalid_email)

    # Enter invalid password.
    _wait(
        driver,
        By.CSS_SELECTOR,
        PASSWORD_INPUT,
    ).send_keys(invalid_password)

    # Submit the login form.
    _wait(
        driver,
        By.XPATH,
        SUBMIT_BUTTON,
    ).click()

    # Expected result:
    # The application should show a generic error message.
    assert _wait(
        driver,
        By.XPATH,
        ERROR_ALERT,
    ).text == "Invalid credentials."

    # Failed authentication must not navigate away from /login.
    assert _current_path(driver) == "/login"

    # The form should recover from the "Signing in..." state.
    submit = _wait(
        driver,
        By.XPATH,
        SUBMIT_BUTTON,
    )

    assert submit.text == "Sign in"
    assert submit.is_enabled()

    # Save execution screenshot for the assignment report.
    driver.save_screenshot(
        "TC-SEL-02-invalid-login.png"
    )