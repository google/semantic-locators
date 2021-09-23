/**
 * @license
 * Copyright 2021 The Semantic Locators Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import {html, render} from 'lit';

import {runBatchOp} from '../../src/lib/batch_cache';
import {findElementBySemanticLocator, findElementsBySemanticLocator} from '../../src/lib/find_by_semantic_locator';

let container: HTMLElement;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
});

afterEach(() => {
  document.body.removeChild(container);
});

describe('findElementsBySemanticLocator', () => {
  describe('explicit roles', () => {
    it('finds by explicit role', () => {
      render(html`<div role="button" id="foo"></div>`, container);

      expect(findElementsBySemanticLocator('{button}', container)).toEqual([
        document.getElementById('foo')!
      ]);
    });

    it('prefers explicit over implicit roles', () => {
      render(html`<button role="link" id="foo"></button>`, container);

      expect(findElementsBySemanticLocator('{button}', container)).toEqual([]);
      expect(findElementsBySemanticLocator('{link}', container)).toEqual([
        document.getElementById('foo')!
      ]);
    });
  });

  describe('implicit role', () => {
    // Tests for one of each type of condition from aria_html_rules.proto
    it('for tag_name', () => {
      render(html`<button id="foo">xxx</button>`, container);

      expect(findElementsBySemanticLocator('{button}', container)).toEqual([
        document.getElementById('foo')!
      ]);
    });

    it('for attribute_takes_value', () => {
      render(
          html`<input type="button" id="foo"><input type="text">`, container);

      expect(findElementsBySemanticLocator('{button}', container)).toEqual([
        document.getElementById('foo')!
      ]);
    });

    it('for attribute_does_not_take_value', () => {
      render(
          html`<table><tr><th id="foo" scope="something">h</th></tr></table>`,
          container);

      expect(findElementsBySemanticLocator('{columnheader}', container))
          .toEqual([document.getElementById('foo')!]);
    });

    it('for present_attribute', () => {
      render(
          html`<a href="https://www.example.com" id="foo">xxx</a><a>xxx</a>`,
          container);

      expect(findElementsBySemanticLocator('{link}', container)).toEqual([
        document.getElementById('foo')!
      ]);
    });

    it('for absent_attribute', () => {
      render(
          html`<select id="foo">xxx</select><select multiple>xxx</select>`,
          container);

      expect(findElementsBySemanticLocator('{combobox}', container)).toEqual([
        document.getElementById('foo')!
      ]);
    });

    it('for non_empty_attribute', () => {
      render(
          html`<img src="data:," id="foo" alt="bar"/> <img src="data:," alt=""/>`,
          container);

      expect(findElementsBySemanticLocator('{img}', container)).toEqual([
        document.getElementById('foo')!
      ]);
    });

    it('for property_takes_string_value', () => {
      render(html`<input id="foo" type="email">`, container);

      expect(findElementsBySemanticLocator('{textbox}', container)).toEqual([
        document.getElementById('foo')!
      ]);
    });

    it('for parent_tag', () => {
      render(
          html`
            <datalist style="display:block;">
              <option id="foo">bar</option>
            </datalist>
            <datalist style="display:block;">
              <div>
                <option>baz</option>
              </div>
            </datalist>`,
          container);

      expect(findElementsBySemanticLocator('{option}', container)).toEqual([
        document.getElementById('foo')!
      ]);
    });

    it('for grandparent_tag', () => {
      render(
          html`
            <select>
              <optgroup label="first">
                <option id="foo">xxx</option>
              </optgroup>
            </select>
              <optgroup label="second">
                <option>yyy</option>
              </optgroup>`,
          container);

      expect(findElementsBySemanticLocator('{option}', container)).toEqual([
        document.getElementById('foo')!
      ]);
    });

    it('for ancestor_tag', () => {
      render(
          html`<table><tr><td id="foo">xxx</td></tr></table><td>yyy</td>`,
          container);

      expect(findElementsBySemanticLocator('{cell}', container)).toEqual([
        document.getElementById('foo')!
      ]);
    });

    it('for not_ancestor_tag', () => {
      render(
          html`<header id="foo">xxx</header><aside><header>yyy</header></aside>`,
          container);

      expect(findElementsBySemanticLocator('{banner}', container)).toEqual([
        document.getElementById('foo')!
      ]);
    });

    it('for not_ancestor_role', () => {
      render(
          html`<header id="foo">xxx</header><div role="complementary"><header>yyy</header></div>`,
          container);

      expect(findElementsBySemanticLocator('{banner}', container)).toEqual([
        document.getElementById('foo')!
      ]);
    });

    it('for attribute_value_greater_than', () => {
      render(html`<select size="2" id="foo"><select size="1">`, container);

      expect(findElementsBySemanticLocator('{listbox}', container)).toEqual([
        document.getElementById('foo')!
      ]);
    });

    it('for attribute_value_less_than', () => {
      render(html`<select size="1" id="foo"><select size="2">`, container);

      expect(findElementsBySemanticLocator('{combobox}', container)).toEqual([
        document.getElementById('foo')!
      ]);
    });

    it('for has_accessible_name', () => {
      render(
          html`<form aria-label="something" id="foo"></form><form></form>`,
          container);

      expect(findElementsBySemanticLocator('{form}', container)).toEqual([
        document.getElementById('foo')!
      ]);
    });

    it('for closest_ancestor_tag_has_role', () => {
      render(
          html`
        <table><tr><td>
          <table role="grid"><tr><td id="foo">aaaa</td></tr></table>
        </td><td>
          <table><tr><td>aaaa</td></tr></table>
        </td></tr></table>
          `,
          container);

      expect(findElementsBySemanticLocator('{gridcell}', container)).toEqual([
        document.getElementById('foo')!
      ]);
    });

    it('for data_in_column and data_in_row', () => {
      render(
          html`
          <table>
            <tr><th id="ch_0">h</th><th id="ch_1">h</th><th id="ch_2">h</th></tr>
            <tr><th id="rh_0">h</th><th id="cell_0">h</th><td id="cell_1">d</td></tr>
            <tr><th id="rh_1">h</th><td id="cell_2">d</td><td id="cell_3">d</td></tr>
          </table>
          `,
          container);

      expect(findElementsBySemanticLocator('{columnheader}', container))
          .toEqual([
            document.getElementById('ch_0')!,
            document.getElementById('ch_1')!,
            document.getElementById('ch_2')!,
          ]);

      expect(findElementsBySemanticLocator('{rowheader}', container)).toEqual([
        document.getElementById('rh_0')!,
        document.getElementById('rh_1')!,
      ]);

      expect(findElementsBySemanticLocator('{cell}', container)).toEqual([
        document.getElementById('cell_0')!,
        document.getElementById('cell_1')!,
        document.getElementById('cell_2')!,
        document.getElementById('cell_3')!,
      ]);
    });
  });

  describe('accessible name', () => {
    // Only basic tests are performed here as we defer to another library
    // for accessible name computation.
    it('matches on name from content', () => {
      render(html`<button id="foo">OK</button>`, container);

      expect(findElementsBySemanticLocator('{button "OK"}', container))
          .toEqual([document.getElementById('foo')!]);
    });

    it('matches on aria-label', () => {
      render(html`<button id="foo" aria-label="OK">xxx</button>`, container);

      expect(findElementsBySemanticLocator('{button "OK"}', container))
          .toEqual([document.getElementById('foo')!]);
    });

    it('accepts leading wildcards', () => {
      render(
          html`
        <button id="foo">This is fine</button>
        <button>This is fine.</button>
        <button>I'm fine</button>
      `,
          container);

      expect(findElementsBySemanticLocator('{button "* is fine"}', container))
          .toEqual([document.getElementById('foo')!]);
    });

    it('accepts trailing wildcards', () => {
      render(
          html`
        <button id="foo">This is fine</button>
        <button>!This is fine</button>
        <button>This isn't bad</button>
      `,
          container);

      expect(findElementsBySemanticLocator('{button "This is *"}', container))
          .toEqual([document.getElementById('foo')!]);
    });

    it('accepts wildcards everywhere', () => {
      render(
          html`
        <button id="foo">I think This is fine!</button>
        <button>I'm fine</button>
        <button>This isn't bad</button>
      `,
          container);

      expect(
          findElementsBySemanticLocator('{button "*This * fine*"}', container))
          .toEqual([document.getElementById('foo')!]);
    });

    it('handles non-ASCII characters', () => {
      render(
          html`<button id="foo" aria-label="блČλñéç‪हिन्दी‬日本語‬‪한국어‬й‪ไ🤖-—–;|<>!&quot;_+">OK</button>`,
          container);

      expect(
          findElementsBySemanticLocator(
              `{button 'блČλñéç‪हिन्दी‬日本語‬‪한국어‬й‪ไ🤖-—–;|<>!"_+'}`))
          .toEqual([document.getElementById('foo')!]);
    });
  });

  it('finds by explicit ARIA attributes', () => {
    render(
        html`
      <div role="button" aria-disabled="true" id="foo">xxx</div>
      <div role="button">yyy</div>`,
        container);

    expect(findElementsBySemanticLocator('{button disabled:true}', container))
        .toEqual([document.getElementById('foo')!]);
  });

  it('finds by implicit ARIA attributes', () => {
    render(
        html`
      <h1 id="foo">Foo</h1>
      <h2>Bar</h2>`,
        container);

    expect(findElementsBySemanticLocator('{heading level:1}', container))
        .toEqual([document.getElementById('foo')!]);
  });

  it('ignores inner nodes if "outer" is at the start', () => {
    render(
        html`
      <ul><li id="foo">
        <ul><li>xxx</li></ul>
        <ul><li><ul><li>yyy</li></ul></li></ul>
      </li></ul>`,
        container);

    expect(findElementsBySemanticLocator('outer {listitem}', container))
        .toEqual([document.getElementById('foo')!]);
  });

  it('ignores inner nodes if "outer" is in the middle', () => {
    render(
        html`
      <ul>
        <li>
          <ul id="foo"><li><ul id="bar"><li>yyy</li></ul></li></ul>
        </li>
      </ul>`,
        container);

    expect(findElementsBySemanticLocator('{listitem} outer {list}', container))
        .toEqual(
            [document.getElementById('foo')!, document.getElementById('bar')!]);
  });

  it('returns all matching nodes in document order', () => {
    render(
        html`
        <ul><li>
          <ul><li>xxx</li></ul>
          <ul><li><ul><li>yyy</li></ul></li></ul>
        </li></ul>`,
        container);

    expect(findElementsBySemanticLocator('{listitem}', container))
        .toEqual(Array.from(container.querySelectorAll('li')));
  });

  it('returns an empty array if no elements match', () => {
    expect(findElementsBySemanticLocator('{button}', container)).toEqual([]);
  });

  it('finds elements with a chain of SemanticNodes', () => {
    render(
        html`
      <ul><li>
        <ul><li>
          <table><tr><td><button id="foo">xxx</button></td></tr></table>
          <table><tr><td></td></tr></table>
          <ul><li></li></ul>
        </li></ul>
      </li><li>yyy</li></ul>`,
        container);

    expect(findElementsBySemanticLocator(
               '{listitem} outer {listitem} {table} {button}', container))
        .toEqual([document.getElementById('foo')!]);
  });

  it('only returns matching elements once', () => {
    render(
        html`
     <table><tbody><tr><td>
       <table><tbody><tr><td>
         <ul><li id="foo"><ul><li>foo</li></ul></li></ul>
       </td></tr></tbody></table>
     </td></tr></tbody></table>`,
        container);
    expect(findElementsBySemanticLocator(
               '{table} outer {list} {listitem}', container))
        .toEqual([document.getElementById('foo')!]);
  });

  it('only looks within the root element', () => {
    render(
        html`
        <div id="root">
          <button id="foo">OK</button>
        </div>
        <button>OK</button>`,
        container);
    expect(findElementsBySemanticLocator(
               '{button "OK"}', document.getElementById('root')!))
        .toEqual([document.getElementById('foo')!]);
  });

  it('excludes hidden elements by default', () => {
    render(
        html`
        <ul aria-hidden="true">
          <li>OK</li>
        </ul>
        <ul style="visibility:hidden;">
          <li>OK</li>
        </ul>
        <ul style="display:none;">
          <li>OK</li>
        </ul>
        <ul id="foo">
          <li id="bar">OK</li>
        </ul>
        `,
        container);

    expect(findElementsBySemanticLocator('{list}', container)).toEqual([
      document.getElementById('foo')!
    ]);
    expect(findElementsBySemanticLocator('{listitem}', container)).toEqual([
      document.getElementById('bar')!
    ]);
  });

  it('caches values if cache is enabled', () => {
    render(
        html`
      <div role="button" id="first">first button</div>
      <div id="second">second button</div>
      `,
        container);
    runBatchOp(() => {
      // Seed cache
      findElementsBySemanticLocator('{button}', container);
      document.getElementById('second')?.setAttribute('role', 'button');

      expect(findElementsBySemanticLocator('{button}', container)).toEqual([
        document.getElementById('first')!
      ]);
    });
    expect(findElementsBySemanticLocator('{button}', container)).toEqual([
      document.getElementById('first')!,
      document.getElementById('second')!,
    ]);
  });

  it('clears cache between runBatchOp calls', () => {
    render(
        html`
      <div role="button" id="first">first button</div>
      <div id="second">second button</div>
      `,
        container);
    runBatchOp(() => {
      // Seed cache
      findElementsBySemanticLocator('{button}', container);
      document.getElementById('second')?.setAttribute('role', 'button');

      expect(findElementsBySemanticLocator('{button}', container)).toEqual([
        document.getElementById('first')!
      ]);
    });
    runBatchOp(() => {
      expect(findElementsBySemanticLocator('{button}', container)).toEqual([
        document.getElementById('first')!,
        document.getElementById('second')!,
      ]);
    });
  });
});

describe('findElementBySemanticLocator', () => {
  it('returns the first matching element in document order', () => {
    render(
        html`
        <ul><li id="foo">
          <ul><li>xxx</li></ul>
          <ul><li><ul><li>yyy</li></ul></li></ul>
        </li></ul>`,
        container);

    expect(findElementBySemanticLocator('{listitem}', container))
        .toEqual(document.getElementById('foo')!);
  });

  it('throws an Error if no elements match', () => {
    expect(() => findElementBySemanticLocator('{button}', container)).toThrow();
  });
});
