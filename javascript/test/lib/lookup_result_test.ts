/**
 * @license
 * Copyright 2021 The Semantic Locators Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import {html, render} from 'lit';

import {buildFailureMessage} from '../../src/lib/lookup_result';
import {SemanticLocator, SemanticNode} from '../../src/lib/semantic_locator';

const DUMMY_LOCATOR = new SemanticLocator([new SemanticNode('button', [])], []);
const START = `Didn't find any elements matching semantic locator {button}.`;

let container: HTMLElement;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
});

afterEach(() => {
  document.body.removeChild(container);
});

describe('buildFailureMessage', () => {
  it('explains if no elements match any of the locator', () => {
    expect(buildFailureMessage(
               DUMMY_LOCATOR,
               {
                 closestFind: [],
                 elementsFound: [],
                 notFound: {role: 'button'},
               },
               [],
               [],
               ))
        .toEqual(`${START} No elements have an ARIA role of button.`);
  });

  it('explains if role fails to match', () => {
    expect(
        buildFailureMessage(
            DUMMY_LOCATOR,
            {
              closestFind: [
                new SemanticNode('list', []), new SemanticNode('listitem', [])
              ],
              elementsFound: [
                document.createElement('div'), document.createElement('div')
              ],
              notFound: {role: 'button'}
            },
            [],
            [],
            ))
        .toEqual(`${
            START} 2 elements matched the locator {list} {listitem}, but none had a descendant with an ARIA role of button.`);
  });

  it('explains if accname fails to match and no elements have accnames', () => {
    render(html`<div id="foo">foo</div><div id="bar">bar</div>`, container);
    expect(
        buildFailureMessage(
            DUMMY_LOCATOR,
            {
              closestFind: [new SemanticNode('list', [])],
              partialFind: {role: 'listitem'},
              elementsFound: [
                document.getElementById('foo')!, document.getElementById('bar')!
              ],
              notFound: {name: 'OK'}
            },
            [],
            [],
            ))
        .toEqual(`${
            START} 2 descendants of {list} with an ARIA role of listitem were found. However none had an accessible name of "OK". No matching elements had an accessible name.`);
  });

  it('contains accnames for near misses', () => {
    render(html`<button aria-label="Not OK" id="foo">`, container);
    expect(buildFailureMessage(
               DUMMY_LOCATOR,
               {
                 closestFind: [new SemanticNode('list', [])],
                 partialFind: {role: 'listitem'},
                 elementsFound: [document.getElementById('foo')!],
                 notFound: {name: 'OK'}
               },
               [],
               [],
               ))
        .toEqual(`${
            START} 1 descendant of {list} with an ARIA role of listitem were found. However it didn't have an accessible name of "OK". Accessible names found: ["Not OK"].`);
  });

  it('contains attribute values for near misses', () => {
    render(html`<div role="checkbox" aria-checked="true" id="foo">`, container);
    expect(buildFailureMessage(
               DUMMY_LOCATOR,
               {
                 closestFind: [new SemanticNode('list', [])],
                 partialFind: {role: 'listitem'},
                 elementsFound: [document.getElementById('foo')!],
                 notFound: {attribute: {name: 'checked', value: 'false'}},
               },
               [],
               [],
               ))
        .toEqual(`${
            START} 1 descendant of {list} with an ARIA role of listitem were found. However it didn't have aria-checked = false. Values found for aria-checked: ["true"].`);
  });

  it('explains a large partialFind', () => {
    render(
        html`<div role="checkbox" aria-checked="false" id="foo">`, container);
    expect(buildFailureMessage(
               DUMMY_LOCATOR,
               {
                 closestFind: [new SemanticNode('list', [])],
                 partialFind: {
                   role: 'listitem',
                   attributes: [{name: 'disabled', value: 'false'}],
                   name: 'bar'
                 },
                 elementsFound: [document.getElementById('foo')!],
                 notFound: {attribute: {name: 'checked', value: 'true'}}
               },
               [],
               [],
               ))
        .toEqual(`${
            START} 1 descendant of {list} with an ARIA role of listitem, aria-disabled = false, and an accessible name of "bar" were found. However it didn't have aria-checked = true. Values found for aria-checked: ["false"].`);
  });

  it('hints if hidden elements are missing', () => {
    expect(buildFailureMessage(
               DUMMY_LOCATOR,
               {
                 closestFind: [],
                 elementsFound: [],
                 notFound: {role: 'button'},
               },
               [document.createElement('div')],
               [],
               ))
        .toEqual(`${
            START} No elements have an ARIA role of button. 1 hidden element matched the locator. To match these elements, ensure they're not hidden (aria-hidden is false and they're not hidden by css).`);
  });

  it('hints if presentational elements are missing', () => {
    expect(buildFailureMessage(
               DUMMY_LOCATOR,
               {
                 closestFind: [],
                 elementsFound: [],
                 notFound: {role: 'button'},
               },
               [],
               [document.createElement('div')],
               ))
        .toEqual(`${
            START} No elements have an ARIA role of button. 1 element would have matched the locator, but it has an ancestor with presentational children (https://www.w3.org/TR/wai-aria-practices/#children_presentational), erasing its semantics.`);
  });
});
