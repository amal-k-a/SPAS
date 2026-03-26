import os

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as ec
from selenium.webdriver.support.ui import WebDriverWait


def test_login_page_loads():
    options = Options()
    options.add_argument('--headless=new')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')

    driver = webdriver.Chrome(options=options)
    base_url = os.environ.get('SELENIUM_BASE_URL', 'http://127.0.0.1')

    try:
        driver.get(base_url)
        WebDriverWait(driver, 20).until(
            ec.presence_of_element_located((By.TAG_NAME, 'body'))
        )
        assert 'Student Analytics' in driver.page_source
    finally:
        driver.quit()
