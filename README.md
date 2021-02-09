# Semantic Locators

Semantic locators are a human readable, resilient and a11y-enforcing way to find
web elements.

They're available in [JavaScript and TypeScript](javascript/README.md) and
[Java WebDriver](webdriver_java/README.md). More bindings are coming soon.

**Just want to get started writing semantic locators? See the
[tutorial](docs/tutorial.md).**

TL;DR: Use semantic locators like this:

HTML                                               | Semantic Locator
-------------------------------------------------- | --------------------------
`<button>OK</button>`                              | `{button 'OK'}`
`<div role="tab" aria-label="Meeting">`            | `{tab 'Meeting'}`
`<ul><li>`                                         | `{list} {listitem}`
`<button>User id: 32659768187</button>`            | `{button 'User id: *'}`
`<div role="checkbox" aria-checked="false"></div>` | `{checkbox checked:false}`

## Introduction

There are various ways to define HTML elements which are semantically identical,
i.e. they permit the same user interactions. The following all express the same
semantics:

```html
<button>OK</button>
<button aria-label="OK">...</button>
<div role="button">OK</div>
<input type="button" aria-label="OK">
<button aria-labelledby="other_element">...</button><div id="other_element">OK</div>
<button id="element_id">...</button><label for="element_id">OK</label>
<div role="button" title="OK">...</div>
```

They are all matched by the semantic locator `{button 'OK'}`.

`button` refers to the ARIA role expressed by the element (explicitly with
`role="button"` or implicitly). Implicit ARIA semantics are defined in
[W3 ARIA in HTML document conformance](https://www.w3.org/TR/html-aria/#docconformance).

`'OK'` refers to the [accessible name](https://www.w3.org/TR/accname-1.1/) of
the element.

```html
<button aria-labelledby="other_element">...</button>
<div id="other_element">OK</div>
```

## Benefits

### Resilient

Semantic locators are less brittle to user-invisible changes. Referencing only
semantics abstracts away implementation details. For example if

```html
<div><span><div><div><div role="button">Send
```

changes to

```html
<div><button>Send
```

then `{button 'Send'}` will still work as a locator.

### Accessible

Semantic locators can help discovering a11y bugs, since they will not work well
on pages with poor a11y.

### Human readable

XPath: `//*//input[@type='submit' and @aria-label='Send']`.

Semantic locator for the same button: `{button 'Send'}`.

### Easy to write

Semantic Locators can be automatically generated using a
[Chrome Extension](https://chrome.google.com/webstore/detail/semantic-locators/cgjejnjgdbcogfgamjebgceckcmfcmji),
or easily written with the help of browser dev tools. See the
[tutorial](docs/tutorial.md) for a guide.

## Getting started

See the getting started instructions for your environment:

*   [JavaScript/TypeScript in the browser](javascript/README.md)
*   [Java WebDriver](webdriver_java/README.md)
*   Something else? Adding support for a new platform is usually simple. See
    [DEVELOPING.md](go/semantic-locators-developing) for instructions

## Limitations

### Inaccessible elements

If an element is inaccessible (it doesn't appear in the accessibility tree) then
no semantic locator will exist for it. This limitation should not come into play
for elements which a _human_ would interact with, as these should be accessible.

However if you want to interact with an element that you don't expect humans to
interact with, you will have to fall back to a different type of locator for
that element.

## Disclaimer

This is not an officially supported Google product.
