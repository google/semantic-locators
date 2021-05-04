# Developing Semantic Locators C#

Install
[ChromeDriver](https://chromedriver.chromium.org/getting-started) and
[geckodriver](https://github.com/mozilla/geckodriver) if they're not already
installed.

Get a copy of the code and verify that tests pass on your system

```bash
git clone https://github.com/google/semantic-locators.git
cd semantic-locators/webdriver_dotnet/SemanticLocators/SemanticLocators.Tests
dotnet test
```

## Design

this version of Semantic Locators is effectively a port of the Java integration.
