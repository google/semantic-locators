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
Locators in the browser. Each should contain a `DEVELOPING.md` file with
instructions specific to that environment

## Adding a new integration

Integrating Semantic Locators with a new language/environment/library is usually
a straightforward task (<1 day of effort).

See [`webdriver_java`](../webdriver_java) for an example.

### Create a README.md and DEVELOPING.md

Two markdown files are required for new integrations in this repository:

1.  `README.md` explaining how a user can install and use your code
2.  `DEVELOPING.md` explaining how a developer can test and deploy your code

### Execute JavaScript

TODO(alexlloyd)

### Handle Errors

TODO(alexlloyd)
