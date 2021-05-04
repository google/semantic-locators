# Copyright 2021 The Semantic Locators Authors
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""WebDriver instances for unit tests."""
from selenium.webdriver import (Chrome, Firefox, ChromeOptions, FirefoxOptions)

chrome_options = ChromeOptions()
chrome_options.headless = True

firefox_options = FirefoxOptions()
firefox_options.headless = True

DRIVERS = {
    "chrome": Chrome(options=chrome_options),
    "firefox": Firefox(options=firefox_options),
}
