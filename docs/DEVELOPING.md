# Developing Semantic Locators

## Get a local copy of the code

```bash
git clone https://github.com/google/semantic-locators.git
```

## Directory structure

The core implementation of Semantic Locators lives in the `javascript`
directory. The code in that directory runs in the browser, finding elements by
Semantic Locators. See [`javascript/DEVELOPING.md`](../javascript/DEVELOPING.md)
for more details about the implementation.

Other directories such as `webdriver_java` contain "wrapper libraries", allowing
for using Semantic Locators from other languages and environments. The purpose
of these libraries is to execute the javascript implementation of Semantic
Locators in the browser.

## Adding a new integration

Integrating Semantic Locators with a new language/environment/library is usually
a straightforward task (&lt;1 day of effort). The following instructions assume
you want to contribute the code back to
[`google/semantic-locators`](https://github.com/google/semantic-locators).

For an example see the implementation for
[`Webdriver Java`](https://github.com/google/semantic-locators/tree/main/webdriver_java).

### Create a README.md and DEVELOPING.md

Create the two markdown files required for new integrations:

1.  `README.md` explaining how a user can install and use the library.
2.  `DEVELOPING.md` explaining how a developer can test and deploy a new version
    of the library.

### Wrapper Binary

[`javascript/wrapper_bin.js`](https://github.com/google/semantic-locators/tree/main/javascript/wrapper/wrapper_bin.js)
contains the compiled definition of Semantic Locators to be used from wrapper
libraries. Avoid duplicating the file within this repo, instead it should be
copied as part of a build script. For example see the `copy-resources` section
in
[`webdriver_java/pom.xml`](https://github.com/google/semantic-locators/tree/main/webdriver_java/pom.xml).

### Execution

Semantic locator resolution is implemented in JavaScript, so you just need a way
to execute JS from your test. Testing frameworks usually provide an API for
this.

See
[`BySemanticLocator.java`](https://github.com/google/semantic-locators/tree/main/webdriver_java/src/main/java/com/google/semanticlocators/BySemanticLocator.java)
for a reference implementation. The basic flow is:

*   Read `wrapper_bin.js`.
*   Execute the script to load Semantic Locators in the browser.
*   Execute `return window.&lt;function&gt;.apply(null, arguments);` where
    `&lt;function&gt;` is a function exported in
    [`wrapper.ts`](https://github.com/google/semantic-locators/blob/main/javascript/wrapper/wrapper.ts)
    (e.g., `return window.findElementBySemanticLocator.apply(null,
    arguments);`).
*   Parse any failures and throw an appropriate exception.

### Tests

All new code must be tested. There's no need to test the full behaviour of
semantic locators, but please include smoke tests, and test things which might
break on serializing/deserializing to send to the browser. See
[`BySemanticLocatorTest.java`](https://github.com/google/semantic-locators/tree/main/webdriver_java/src/test/java/com/google/semanticlocators/BySemanticLocatorTest.java)
for an example.

### CI

We strongly recommended adding Continuous Integration to test and lint your
code. We use GitHub actions - see the existing workflows in
`.github/workflows/*.yml`.

### Send a Pull Request

Open a pull request in
[`google/semantic-locators`](https://github.com/google/semantic-locators) so a
project maintainer can review it.

### Codelab

Please ask a Googler contributor to add code examples to this codelab.
