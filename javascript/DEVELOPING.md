# Developing Semantic Locators JS/TS

## Setup

Install yarn if it's not already installed

```bash
npm install -g yarn
```

Get a copy of the code and verify that tests pass on your system

```bash
git clone https://github.com/google/semantic-locators.git
cd semantic-locators/javascript
yarn test
```

## Testing

Tests live in the `test` directory, and can be run with `yarn test`. All new
code must have associated tests.

## Design

### Code Structure

[`src/semantic_locators.ts`](src/semantic_locators.ts) is the main entry point,
which re-exports functions from
[`find_by_semantic_locator.ts`](src/lib/find_by_semantic_locator.ts).

The definitions of ARIA semantics (e.g. defining that `<input type="submit">` is
a `button`) can be found in [`role_map.ts`](src/lib/role_map.ts).

### Locating by Selectors

Let's take a high-level look at how a Semantic Locator is resolved - how do we
go from `{button 'OK'}` to the correct elements in the DOM?

#### Locating by Role

First we find all elements which have a role of `button` in
[`role.ts`](src/lib/role.ts). In order to do this efficiently we use CSS
selectors wherever possible. [`role_map.ts`](src/lib/role_map.ts) gives us 2
things for the role `button`:

1.  An exact selector - `button,summary`. We know that any element matching this
    selector has a role of button (unless that is overridden with an explicit
    `role=something`)
2.  A conditional selector, comprising a greedy selector (`input`) and some
    conditions (`type` is `button`, `image`, `reset` or `submit`). For an
    element to match this conditional selector, it must match the greedy
    selector, and all conditions must be true.

From these selectors we can find all elements with the role `button`.

#### Filtering by name

Then we calculate the accessible name of each of these elements using the
[accname](https://github.com/google/accname) library, returning any with the
accessible name `OK`.

#### Filtering by attributes

Similarly to filtering by name, any attributes in the locator are calculated for
candidate elements, and those which don't match are filtered out.

## Deploying

Once your change is ready, bump the version number in
[`package.json`](package.json) according to
[Semantic Versioning](https://semver.org/) and open a PR. After it has been
reviewed and merged, an admin will deploy the new version to NPM.
