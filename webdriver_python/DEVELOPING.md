# Developing Semantic Locators Python

Install [Poetry](https://python-poetry.org/docs/),
[ChromeDriver](https://chromedriver.chromium.org/getting-started) and
[geckodriver](https://github.com/mozilla/geckodriver) if they're not already
installed.

Get a copy of the code and verify that tests pass on your system

```bash
git clone https://github.com/google/semantic-locators.git
cd semantic-locators/webdriver_python
poetry install
./scripts/test.sh
```

## Design

The WebDriver version of Semantic Locators is a thin wrapper around the
JavaScript implementation. It essentially performs `driver.execute_script` plus
some error handling.
