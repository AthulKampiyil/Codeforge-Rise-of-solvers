import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

@pytest.fixture(scope="module")
def driver():
    options = webdriver.ChromeOptions()
    # options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    
    driver = webdriver.Chrome(options=options)
    driver.implicitly_wait(10)
    
    yield driver
    
    driver.quit()

def test_home_page_and_navigation(driver):
    """
    Test Case: UI Navigation
    Submitted by: Roll No 2024BCD0037
    """
    driver.get("http://localhost:5173")
    
    # Wait for the CODEFORGE logo/title
    logo = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.XPATH, "//a[contains(text(), 'CODEFORGE')]"))
    )
    assert logo.is_displayed()

    # Find the 'Sign in' link
    sign_in_link = driver.find_element(By.XPATH, "//a[contains(text(), 'Sign in')]")
    sign_in_link.click()
    
    # Wait for the login page to load by checking for the login card title
    login_title = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.XPATH, "//h1[contains(text(), 'CODEFORGE')]"))
    )
    assert login_title.is_displayed()
    assert "Sign in to your village" in driver.page_source
