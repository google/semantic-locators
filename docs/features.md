# Features

## Basic syntax

The following locator identifies an element anywhere on the page with a role of
`button` and an accessible name of `OK`:

`{button 'OK'}`

The accessible name can also be omitted to match all `button`s:

`{button}`

Both single and double quotes can be used for the accessible name - `{button
'OK'}` or `{button "It's OK"}`.

## Locating descendants

Locators can be combined to find descendants - for example `{dialog} {button
'Send'}` would find the following send button:

```html
<div role="dialog">
  <div>
    <table><tr><td><button aria-label="Send">...</button></td></tr></table>
  </div>
</div>
```

## Wildcards

Matching on a substring of the value is also possible, using `*` as a wildcard.

`{button 'example.com*'}`

matches:

```html {highlight="content:example\.com"}
<button>example.com/abc-def-ghi</button>
```

Wildcards can also be used anywhere in a name e.g. `{button
'https://*.example.com/*'}` for

```html {highlight="content:https:// content:\.example\.com/"}
<button>https://subdomain.example.com/path</button>
```

## Attributes

It's possible to select elements based on attributes (ARIA
[states and properties](https://www.w3.org/WAI/PF/aria/states_and_properties)).
Both explicit `aria-` prefixed attributes and implicit equivalents are checked.
For example

`{button disabled:true}`

will match either of the following elements

```html
<button disabled>foo</button>
<div role="button" aria-disabled="true">foo</div>
```

The source of truth for currently supported attributes is
[`SUPPORTED_ATTRIBUTES`](https://github.com/google/semantic-locators/search?q=SUPPORTED_ATTRIBUTES+filename%3Atypes.ts).

## Nested elements - 'outer' syntax

If multiple nested elements match the same semantic locator then it's possible
to specify only matching the outermost matching element using the 'outer'
modifier. For example:

```html
<table id="outer">
  <ul>
    <li>
      <table id="middle">
        <table id="inner"></table>
      </table>
    </li>
  </ul>
</table>
```

*   `{table}` matches all 3 tables.
*   `outer {table}` matches only the outer table.
*   `{listitem} outer {table}` matches only the middle table.
*   `{table} {table} {table}` matches only the inner table.
