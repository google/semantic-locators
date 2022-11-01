# Semantic Locators in JS/TS

Semantic locators can be used in JS or TS running in the browser.

```bash
$ npm install --save-dev webdriver-semantic-locators
```

Once installed, use Semantic Locators as follows:

```typescript
import {bySemanticLocator, findElementBySemanticLocator, findElementsBySemanticLocator, closestPreciseLocatorFor} from 'webdriver-semantic-locators';
import {closestPreciseLocatorFor} from 'semantic-locators/gen'
...
const searchBar = driver.findElement(bySemanticLocator("{header 'Search'}"))
const searchButton = findElementBySemanticLocator(driver, "{button 'Google search'}", searchBar);  // or searchBar.findElement(bySemanticLocator("{button 'Google search'}"));
const allButtons = findElementsBySemanticLocator(driver, "{button}");

const generated = closestPreciseLocatorFor(driver, searchButton); // {button 'Google search'}
```

General Semantic Locator documentation can be found on
[GitHub](http://github.com/google/semantic-locators#readme).
