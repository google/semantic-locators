# Semantic Locators in JS/TS

Semantic locators can be used in JS or TS running in the browser.

```bash
$ npm install --save-dev semantic-locators
```

Once installed, use Semantic Locators as follows:

```typescript
import {findElementBySemanticLocator, findElementsBySemanticLocator} from 'semantic-locators';
import {closestPreciseLocatorFor} from 'semantic-locators/gen'
...
const searchButton = findElementBySemanticLocator("{button 'Google search'}");
const allButtons = findElementsBySemanticLocator("{button}");

const generated = closestPreciseLocatorFor(searchButton); // {button 'Google search'}
```

General Semantic Locator documentation can be found on
[GitHub](http://github.com/google/semantic-locators#readme).
