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
    
    email_input = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.XPATH, "//input[@type='email']"))
    )
    password_input = driver.find_element(By.XPATH, "//input[@type='password']")
    submit_button = driver.find_element(By.XPATH, "//button[@type='submit']")
    
    # STUDENT SPECIFIC TEST DATA: Roll No 2024BCD0037
    student_roll_no = "2024BCD0037"
    
    # Enter INVALID credentials using the Roll No to prove it is student-specific
    email_input.send_keys(f"{student_roll_no}@student.edu")
    password_input.send_keys(f"wrongpass_{student_roll_no}")
    
    # Submit form
    submit_button.click()
    
    # Wait for the error message to appear on screen
    error_message = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.XPATH, "//p[@role='alert' and contains(text(), 'Invalid credentials.')]"))
    )
    
    # Assert that the error message is displayed
    assert error_message.is_displayed()
    import time
    time.sleep(5)  # Pause to let the user take a screenshot
