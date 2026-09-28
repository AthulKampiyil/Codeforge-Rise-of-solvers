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

def test_negative_login_flow(driver):
    """NEGATIVE TEST: Ensure invalid credentials show an error message."""
    driver.get("http://localhost:5173/login")
    
    # Find email and password inputs
    email_input = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.XPATH, "//input[@type='email']"))
    )
    password_input = driver.find_element(By.XPATH, "//input[@type='password']")
    submit_button = driver.find_element(By.XPATH, "//button[@type='submit']")
    
    # Enter INVALID credentials
    email_input.send_keys("hacker@example.com")
    password_input.send_keys("totallywrongpassword123")
    
    # Submit form
    submit_button.click()
    
    # Wait for the error message to appear on screen
    # Since the frontend catches login errors and sets setError("Invalid credentials.")
    error_message = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.XPATH, "//p[@role='alert' and contains(text(), 'Invalid credentials.')]"))
    )
    
    # Assert that the error message is displayed
    assert error_message.is_displayed()
