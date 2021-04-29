# Semantic Locators in Python WebDriver

Semantic locators can be used with Selenium WebDriver in a similar way to
`ByXPath` or `ByCssSelector`. Currently only available for Python 3.6+.

Install from PyPi:

`python -m pip install semantic-locators`

Once installed, use Semantic Locators as follows:

```python
from semantic_locators import (
    find_element_by_semantic_locator,
    find_elements_by_semantic_locator,
    closest_precise_locator_for,
)
...

search_button = find_element_by_semantic_locator(driver, "{button 'Google search'}")
all_buttons = find_elements_by_semantic_locator(driver, "{button}")

generated = closest_precise_locator_for(search_button); # {button 'Google search'}
```

General Semantic Locator documentation can be found on
[GitHub](http://github.com/google/semantic-locators#readme).
