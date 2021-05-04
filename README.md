# Semantic Locators

![Magnifying glass icon](docs/img/icon_64dp.svg)

Semantic Locators let you specify HTML elements in code similar to how you might
describe them to a human. For example, a create button might have a semantic
locator of `{button 'Create'}`.

Semantic Locators are stable, readable, enforce accessibility, and can be
auto-generated.

Just want to get started writing semantic locators? See the
[tutorial](docs/tutorial.md), or read on for an introduction.

## Getting started

See the getting started instructions for your environment:

*   [JavaScript/TypeScript in the browser](javascript/README.md)
*   [Java WebDriver](webdriver_java/README.md)
*   [Python WebDriver](webdriver_python/README.md)
*   [.NET WebDriver](webdriver_dotnet/README.md)
*   Something else? Adding support for a new platform is simple. See
    [DEVELOPING.md](docs/DEVELOPING.md) for instructions.

## Examples

HTML                                               | Semantic Locator
-------------------------------------------------- | --------------------------
`<button>OK</button>`                              | `{button 'OK'}`
`<div role="tab" aria-label="Meeting">`            | `{tab 'Meeting'}`
`<ul><li>`                                         | `{list} {listitem}`
`<button>User id: 32659768187</button>`            | `{button 'User id: *'}`
`<div role="checkbox" aria-checked="false"></div>` | `{checkbox checked:false}`

## Why Semantic Locators?

As the name suggests, Semantic Locators find elements based on their
**semantics**. This has a number of benefits over other types of locators.

### Semantics

First we should define the term "semantics".

The semantics of an element describe its meaning to a user. Is it a button or a
checkbox? Will it submit or cancel an operation? When using assistive
technologies like screen readers, the semantics of an element determine how it
is described to users.

There are many semantically equivalent ways to implement OK buttons. The
following elements are all matched by the semantic locator `{button 'OK'}`.

```html
<button>OK</button>
<button aria-label="OK">...</button>
<div role="button">OK</div>
<input type="submit" aria-label="OK">
<button aria-labelledby="other_element">...</button><div id="other_element">OK</div>
<button id="element_id">...</button><label for="element_id">OK</label>
```

To be precise, `button` refers to the
**[ARIA role](https://www.w3.org/TR/wai-aria/#usage_intro)** expressed by the
element. `'OK'` refers to the
**[accessible name](https://www.w3.org/TR/accname/#dfn-accessible-name)** of the
element.

What benefits does finding elements by their semantics provide?

### Stability

Semantic locators are less brittle to user-invisible changes. Matching semantics
abstracts away implementation details. For example if

```html
<div><span><div><div><div role="button" aria-label="Send">
```

changes to

```html
<div><button>Send
```

then `{button 'Send'}` will still work as a locator.

### Accessibility

Semantic locators can help surface missing or broken semantics, as locators
won't exist for inaccessible elements. For example, if your submit button has an
incorrect accessible name, the error from Semantic Locators can reveal the bug:

```console
> findBySemanticLocator('{button "Submit"}');

Error:
Didn't find any elements matching semantic locator {button “Submit”}.
1 element with an ARIA role of button was found.
However it didn't have an accessible name of "Submit".
Accessible names found: ["right_arrow.png"].
```

### Readability

Semantics are meant for human consumption, and so are semantic locators. They're
very similar to how a screen-reader would announce elements to a non-sighted
user.

**XPath**: `//input[@type='submit' and @aria-label='Send']`

**Semantic Locator**: `{button 'Send'}`

### Cheap to produce

Semantic Locators can be automatically generated from an
[interactive playground](https://google.github.io/semantic-locators), a
[Chrome Extension](https://chrome.google.com/webstore/detail/semantic-locators/cgjejnjgdbcogfgamjebgceckcmfcmji),
or easily written with the help of browser dev tools. See the
[tutorial](docs/tutorial.md) for a guide.

## Why not Semantic Locators?

### You don't care about a11y

Semantic locators rely on HTML accessibility (a11y) features to find elements.
Therefore, if your app is inaccessible to a screen reader it is unlikely to work
with semantic locators. If you're looking to improve a11y, introducing semantic
locators can be a great strategy!

Most modern web frameworks are accessible by default, and if you use semantic
HTML (e.g., `<button>`, `<input>` and `<li>` rather than `<div>` for everything)
your app will benefit from native a11y features. So you may not have any
additional work to do.

If you haven't considered making your site accessible yet, now is a great time
to do so! Consider that
[1 billion](https://www.un.org/development/desa/disabilities/resources/factsheet-on-persons-with-disabilities.html)
people worldwide (~15%) have a disability and may have difficulty using apps
written without a11y in mind. Accessible apps are also
[more usable for everyone](https://www.w3.org/WAI/fundamentals/accessibility-usability-inclusion/#accessible-usable).
And if that's not enough of an incentive, a11y is a
[legal requirement](https://www.w3.org/WAI/business-case/#minimize-legal-risk)
in many jurisdictions.

### You have cross-language requirements for your tests

...and no way to access localized strings from your tests.

Semantic locators use the text that a screen reader would read to a human, so
are usually locale-specific. If you want to test in multiple languages, you will
most likely have to adapt your locators.

See the [faq](docs/faq.md) for a discussion of this requirement and potential
solutions.

## Disclaimer

This is not an officially supported Google product.
