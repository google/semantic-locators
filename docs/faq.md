# FAQ

## How can I handle internationalization/localization (i18n/L10n)?

Semantic locators don't yet have built-in support for tests with strong
cross-language requirements. In general you'll need a different locator for each
locale, as `{button 'Hello'}` won't find `&lt;button&gt;Bonjour&lt;/button&gt;`.
Solutions to localized tests will be specific to your L10n method and test
environment, but there are a few general approaches which may work.

One solution is to parameterize tests based on the locale, and get the localized
string from an id and locale. A pseudocode example:

```
function myTest(@Parameter locale):
  submitMsg = readFromTranslationFile("SUBMIT", locale)
  searchButton = findElementBySemanticLocator("{button '" + submitMsg + "'}")
```

Some libraries (such as [Closure](https://developers.google.com/closure/library)
) perform L10n when compiling JavaScript. It may be possible to access L10n APIs
from your test and inject the localized strings into locators. For example in
Closure:

```typescript
const searchButton = findElementBySemanticLocator(`{button '${goog.getMsg('Search')}'}`);
```

## Which browsers are supported?

Semantic locators are tested on recent versions of:

-   Chrome
-   Firefox
-   Internet Explorer

Bugs and patches are accepted for other major browsers.

## Please add support for XXX language/environment

See the section "Integrating with your tests". If you can't add support yourself
for a certain platform, feel free to file an issue on
[GitHub](https://github.com/google/semantic-locators/issues/new?assignees=&labels=enhancement&template=feature_request.md&title=)

## I have more questions

Please
[file an issue on GitHub](https://github.com/google/semantic-locators/issues/new)
to get in touch.
