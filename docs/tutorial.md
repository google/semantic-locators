# Tutorial

This doc is a step-by-step guide to writing (or auto-generating) semantic
locators.

Semantic locators have one required part, the ARIA role, and two optional parts,
accessible name and ARIA attributes. The role and name are almost always enough
to identify elements.

In the locator `{button 'OK'}` the role is `button` and the accessible name is
`OK`.

Usually you won't have to write semantic locators by hand as they can be easily
auto-generated from a Chrome extension, an interactive playground, or from code.

## Chrome Extension

An easy way to create Semantic Locators for your app is to auto-generate them
with a
[Chrome Extension](https://chrome.google.com/webstore/detail/semantic-locators/cgjejnjgdbcogfgamjebgceckcmfcmji).

Install the extension and click the icon next to the URL bar to get started.

## Playground

The interactive
[semantic locator playground](https://google.github.io/semantic-locators/playground)
auto-generates semantic locators for elements in some HTML you enter. It can be
useful for:

*   Writing locators for many elements at once
*   Sharing HTML snippets with their a11y data
*   Debugging the semantics of an element

## Generate locators from code

Locator generation is available from the semantic locator libraries. If you
already have some other types of locators you can generate semantic locators for
these elements by temporarily adding generation code to existing tests.

The following example logs generated semantic locators to the console. However,
you could go further, for example, automatically re-writing your tests to use
semantic locators. We'd love to see what you build in this space!

### Java

```java
import com.google.semanticlocators.BySemanticLocator;
...

WebElement targetElement = driver.findElement(By.xpath("//div[@aria-label='Cheese']"));
System.out.println("Semantic locator: " + BySemanticLocator.closestPreciseLocatorFor(targetElement));
```

### Python

```python
from semantic_locators import closest_precise_locator_for
...

target_element = driver.find_element(By.XPATH, "//div[@aria-label='Cheese']");
print("Semantic locator: " + closest_precise_locator_for(target_element));
```

### JavaScript/TypeScript

```javascript
import {closestPreciseLocatorFor} from 'semantic-locators/gen'
...

const targetElement = document.getElementById('cheese');
console.log('Semantic locator: ' + closestPreciseLocatorFor(targetElement));
```

## Developer Console

If for some reason auto-generation doesn't work for you, the Accessibility tab
of browser developer tools can help you easily write semantic locators.

1.  Open the Developer Console by pressing F12.
2.  **[Chrome]** Select the target element with the element picker (⌘+Shift+C or
    Ctrl+Shift+C) then navigate to the Accessibility tab.<br />.
    **[Firefox]** Navigate to the Accessibility tab, click the picker icon (top left
    of Dev tools), then click the target element.
3.  Check the name and role of the element. For an element with the role
    `button` and name `Create`, the semantic locator is `{button 'Create'}`.

![Screenshot of the accessibility tree in Chrome developer console. The
highlighted element is described in the a11y tree as button
"create"](assets/a11y_tree.png)

## Dynamic or very long accessible names

If the accessible name is dynamic, or is too long for your test, you can use a
wildcard value. Values accept `*` as a wildcard (e.g., `'* view'`,
`'https://*.google.com/*'`).

[Try it in the playground](https://google.github.io/semantic-locators/playground?input=PGJ1dHRvbiBhcmlhLWxhYmVsPSJUb2RheSwgMXN0IEFwcmlsIj4gICAgPCEtLSB7YnV0dG9uICdUb2RheSonfSAtLT4KICBUb2RheQo8L2J1dHRvbj4%3D&includeTextNodes=false)

```html
<button aria-label="Today, 1st April">    <!-- {button 'Today*'} -->
  Today
</button>
```

## Optional names

It's not always necessary to specify a name - some elements have no accessible
name, or a completely dynamic one. `{list}` is a valid locator if you know
there's only going to be one list on the page.

[Try it in the playground](https://google.github.io/semantic-locators/playground?input=PHVsPiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8IS0tIHtsaXN0fSAtLT4KICA8bGkgYXJpYS1sYWJlbD0iQ2hlZXNlIj5DaGVlc2U8L2xpPiAgICAgICAgICA8IS0tIHtsaXN0aXRlbSAnQ2hlZXNlJ30gLS0%2BCiAgPGxpIGFyaWEtbGFiZWw9IkNob2NvbGF0ZSI%2BQ2hvY29sYXRlPC9saT4gICAgPCEtLSB7bGlzdGl0ZW0gJ0Nob2NvbGF0ZSd9IC0tPgo8L3VsPg%3D%3D&includeTextNodes=false)

```html
<ul>                                           <!-- {list} -->
  <li aria-label="Cheese">Cheese</li>          <!-- {listitem 'Cheese'} -->
  <li aria-label="Chocolate">Chocolate</li>    <!-- {listitem 'Chocolate'} -->
</ul>
```

## Refining locators

Using the above strategies might still return multiple elements. In this case
you can make a semantic locator more precise in a few ways.

### Multiple Semantic Locator elements

Semantic locators can be combined, with later elements being descendants of
earlier elements.

Auto-generated locators will contain multiple elements if a single element
doesn't uniquely identify the target.

[Try it in the playground](https://google.github.io/semantic-locators/playground?input=PHVsPgogIDxsaSBhcmlhLWxhYmVsPSJDaGVlc2UiPgogICAgPGJ1dHRvbiBhcmlhLWxhYmVsPSJFYXQiPiAgIDwhLS0ge2xpc3RpdGVtICdDaGVlc2UnfSB7YnV0dG9uICdFYXQnfSAtLT4KICAgICAgRWF0IGNoZWVzZQogICAgPC9idXR0b24%2BCiAgPC9saT4KICA8bGkgYXJpYS1sYWJlbD0iQ2hvY29sYXRlIj4KICAgIDxidXR0b24gYXJpYS1sYWJlbD0iRWF0Ij4gICA8IS0tIHtsaXN0aXRlbSAnQ2hvY29sYXRlJ30ge2J1dHRvbiAnRWF0J30gLS0%2BCiAgICAgIEVhdCBjaG9jb2xhdGUKICAgIDwvYnV0dG9uPgogIDwvbGk%2BCjwvdWw%2B&includeTextNodes=false)

```html
<ul>
  <li aria-label="Cheese">
    <button aria-label="Eat">   <!-- {listitem 'Cheese'} {button 'Eat'} -->
      Eat cheese
    </button>
  </li>
  <li aria-label="Chocolate">
    <button aria-label="Eat">   <!-- {listitem 'Chocolate'} {button 'Eat'} -->
      Eat chocolate
    </button>
  </li>
</ul>
```

### Attributes

Semantic locators can locate elements based on attributes such as `checked` and
`disabled`. Both native html (`&lt;button disabled&gt;`) and explicit semantics
( `aria-disabled="true"`) are included.

The source of truth for supported attributes is
[`SUPPORTED_ATTRIBUTES`](https://github.com/google/semantic-locators/search?q=SUPPORTED_ATTRIBUTES+filename%3Atypes.ts).

Note: Auto-generated semantic locators don't yet include attributes.

[Try it in the playground](https://google.github.io/semantic-locators/playground?input=PCEtLSBOb3RlOiBUaGUgYXV0by1nZW5lcmF0ZWQgbG9jYXRvcnMgYmVsb3cgZG9uJ3QgeWV0IGluY2x1ZGUgYXR0cmlidXRlcyAtLT4KCjxoMT5DaGVlc2U8L2gxPgo8bGFiZWw%2BCiAgPGlucHV0IHR5cGU9ImNoZWNrYm94Ij4gICAgICAgPCEtLSB7Y2hlY2tib3ggJ0VkaWJsZScgY2hlY2tlZDpmYWxzZX0gLS0%2BCiAgRWRpYmxlCjwvbGFiZWw%2BCjxicj4KPGJ1dHRvbiBkaXNhYmxlZD5FYXQ8L2J1dHRvbj4gICA8IS0tIHtidXR0b24gJ0VhdCcgZGlzYWJsZWQ6dHJ1ZX0gLS0%2B&includeTextNodes=false)

```html
<h1>Cheese</h1>
<label>
  <input type="checkbox">       <!-- {checkbox 'Edible' checked:false} -->
  Edible
</label>
<br>
<button disabled>Eat</button>   <!-- {button 'Eat' disabled:true} -->
```

### Outer

Sometimes (e.g., when working with lists) nested elements may both match the
same locator. In this case you can use the `outer` keyword to match only the
outermost element.

[Try it in the playground](https://google.github.io/semantic-locators/playground?input=PHVsPiAgICAgICAgICAgICAgICAgICAgPCEtLSBvdXRlciB7bGlzdH0gLS0%2BCiAgPGxpPiAgICAgICAgICAgICAgICAgIDwhLS0gb3V0ZXIge2xpc3RpdGVtfSAtLT4KICAgIDx1bD4gICAgICAgICAgICAgICAgPCEtLSB7bGlzdGl0ZW19IHtsaXN0fSAtLT4KICAgICAgPGxpPkNoZWVzZTwvbGk%2BICAgPCEtLSB7bGlzdGl0ZW19IHtsaXN0aXRlbX0gLS0%2BCiAgICA8L3VsPgogIDwvbGk%2BCjwvdWw%2B&includeTextNodes=false)

```html
<ul>                    <!-- outer {list} -->
  <li>                  <!-- outer {listitem} -->
    <ul>                <!-- {listitem} {list} -->
      <li>Cheese</li>   <!-- {listitem} {listitem} -->
    </ul>
  </li>
</ul>
```
