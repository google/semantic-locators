# Semantic Locators

Semantic locators are a way to find web elements. They're stable, readable,
enforce accessibility and can be auto-generated.

As an example, the locator for a Send button would be `{button 'Send'}`.

Just want to get started writing semantic locators? See the
[tutorial](docs/tutorial.md), or read on for an introduction.

## Getting started

See the getting started instructions for your environment:

*   [JavaScript/TypeScript in the browser](javascript/README.md)
*   [Java WebDriver](webdriver_java/README.md)
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
**semantics**. This has a number of benefits over other types of locators, but
first we must define the term "semantics".

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
<button id="element_id">...</button><label for="element_id">OK</label
```

To be precise, `button` refers to the
**[ARIA role](https://www.w3.org/TR/html-aria/#docconformance)** expressed by
the element. `'OK'` refers to the
**[accessible name](https://www.w3.org/TR/accname/)** of the element.

What benefits does matching semantics provide?

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

Semantic locators can help surface missing or broken ARIA, as they won't exist
for inaccessible elements. For example if your submit button has an incorrect
accessible name, you may get an error like:

```
> findBySemanticLocator('{button "Submit"}');

Error:
Didn't find any elements matching semantic locator {button “Submit”}.
1 element with an ARIA role of button was found.
However it didn't have an accessible name of "Submit".
Accessible names found: ["arrow.png"].
```

### Readability

Semantics are meant for human consumption, and so are semantic locators. They're
very similar to how a screen-reader would announce elements to a non-sighted
user.

XPath: `//*//input[@type='submit' and @aria-label='Send']`.

Equivalent Semantic Locator: `{button 'Send'}`.

### Cheap to produce

Semantic Locators can be automatically generated using a
[Chrome Extension](https://chrome.google.com/webstore/detail/semantic-locators/cgjejnjgdbcogfgamjebgceckcmfcmji),
or easily written with the help of browser dev tools. See the
[tutorial](docs/tutorial.md) for a guide.

## Disclaimer

This is not an officially supported Google product.
