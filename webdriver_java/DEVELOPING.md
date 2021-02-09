# Developing Semantic Locators Java

Install
[Maven](https://maven.apache.org/guides/getting-started/maven-in-five-minutes.html),
[ChromeDriver](https://chromedriver.chromium.org/getting-started) and
[geckodriver](https://github.com/mozilla/geckodriver) if they're not already
installed.

Get a copy of the code and verify that tests pass on your system

```bash
git clone https://github.com/google/semantic-locators.git
cd semantic-locators/webdriver_java
mvn test
```

## Design

The WebDriver version of Semantic Locators is a thin wrapper around the
JavaScript implementation. It essentially performs `driver.executeScript` plus
some error handling.
