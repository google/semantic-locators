/**
 * @license
 * Copyright 2021 The Semantic Locators Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import {html, render} from 'lit';

import {computeARIAAttributeValue} from '../../src/lib/attribute';

describe('computeARIAAttributeValue', () => {
  let container: HTMLElement;
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('respects explicitly specified aria-* attributes', () => {
    render(
        html`
    <div id="checked" role="checkbox" aria-checked="true"></div>
    <div id="current" role="link" aria-current="page"></div>
    <div id="pressed" role="button" aria-pressed="true"></div>
    <table>
      <div id="rowindex" role="row" aria-rowindex="3"></div>
    </table>
    `,
        container);

    expect(computeARIAAttributeValue(
               document.getElementById('checked')!, 'checked'))
        .toEqual('true');
    expect(computeARIAAttributeValue(
               document.getElementById('current')!, 'current'))
        .toEqual('page');
    expect(computeARIAAttributeValue(
               document.getElementById('pressed')!, 'pressed'))
        .toEqual('true');
    expect(computeARIAAttributeValue(
               document.getElementById('rowindex')!, 'rowindex'))
        .toEqual('3');
  });

  describe('for aria-checked', () => {
    it(`returns the default of null when element.checked isn't valid`, () => {
      render(
          html`
    <button id="button" role="checkbox"></button>
    <ul id="list"><li id="listitem">foo</li></ul>
    <table>
      <tr id="row"></tr>
    </table>
    <form><input type="button" id="input" value="foo"></form>
    `,
          container);

      expect(computeARIAAttributeValue(
                 document.getElementById('button')!, 'checked'))
          .toBeNull();
      expect(computeARIAAttributeValue(
                 document.getElementById('list')!, 'checked'))
          .toBeNull();
      expect(computeARIAAttributeValue(
                 document.getElementById('listitem')!, 'checked'))
          .toBeNull();
      expect(
          computeARIAAttributeValue(document.getElementById('row')!, 'checked'))
          .toBeNull();
      expect(computeARIAAttributeValue(
                 document.getElementById('input')!, 'checked'))
          .toBeNull();
    });

    it(`returns the value of element.checked`, () => {
      render(
          html`
    <form>
      <input type="checkbox" id="checkbox" value="checkbox">
      <input type="radio" id="radio" checked value="radio">
    </form>
    `,
          container);

      expect(computeARIAAttributeValue(
                 document.getElementById('checkbox')!, 'checked'))
          .toEqual('false');
      expect(computeARIAAttributeValue(
                 document.getElementById('radio')!, 'checked'))
          .toEqual('true');
    });
  });

  describe('for aria-current', () => {
    it(`returns the default of false when the aria-current attribute is missing`,
       () => {
         render(
             html`
    <button id="button" role="checkbox"></button>
    <ul id="list"><li id="listitem">foo</li></ul>
    <table>
      <tr id="row"></tr>
    </table>
    <form><input type="button" id="input" value="foo"></form>
    `,
             container);

         expect(computeARIAAttributeValue(
                    document.getElementById('button')!, 'current'))
             .toEqual('false');
         expect(computeARIAAttributeValue(
                    document.getElementById('list')!, 'current'))
             .toEqual('false');
         expect(computeARIAAttributeValue(
                    document.getElementById('listitem')!, 'current'))
             .toEqual('false');
         expect(computeARIAAttributeValue(
                    document.getElementById('row')!, 'current'))
             .toEqual('false');
         expect(computeARIAAttributeValue(
                    document.getElementById('input')!, 'current'))
             .toEqual('false');
       });
  });

  describe('for aria-pressed', () => {
    it(`returns the default of false when the aria-pressed attribute is missing`,
       () => {
         render(
             html`
    <button id="button"></button>
    <ul id="list"><li id="listitem">foo</li></ul>
    <table>
      <tr id="row"></tr>
    </table>
    <form><input type="button" id="input" value="foo"></form>
    `,
             container);

         expect(computeARIAAttributeValue(
                    document.getElementById('button')!, 'pressed'))
             .toEqual('false');
         expect(computeARIAAttributeValue(
                    document.getElementById('list')!, 'pressed'))
             .toEqual('false');
         expect(computeARIAAttributeValue(
                    document.getElementById('listitem')!, 'pressed'))
             .toEqual('false');
         expect(computeARIAAttributeValue(
                    document.getElementById('row')!, 'pressed'))
             .toEqual('false');
         expect(computeARIAAttributeValue(
                    document.getElementById('input')!, 'pressed'))
             .toEqual('false');
       });
  });

  describe('for aria-disabled', () => {
    it(`returns the default of false when element.disabled isn't valid`, () => {
      render(
          html`
    <ul id="list"><li id="listitem">foo</li></ul>
    <table>
      <tr id="row"></tr>
    </table>
    `,
          container);

      expect(computeARIAAttributeValue(
                 document.getElementById('list')!, 'disabled'))
          .toEqual('false');
      expect(computeARIAAttributeValue(
                 document.getElementById('listitem')!, 'disabled'))
          .toEqual('false');
      expect(computeARIAAttributeValue(
                 document.getElementById('row')!, 'disabled'))
          .toEqual('false');
    });

    it(`returns the value of element.disabled`, () => {
      render(
          html`
    <button id="button">button</button>
    <textarea id="textarea" disabled></textarea>
    <form>
      <input type="checkbox" id="checkbox" disabled value="checkbox">
      <input type="radio" id="radio" value="radio">
    </form>
    `,
          container);

      expect(computeARIAAttributeValue(
                 document.getElementById('button')!, 'disabled'))
          .toEqual('false');
      expect(computeARIAAttributeValue(
                 document.getElementById('textarea')!, 'disabled'))
          .toEqual('true');
      expect(computeARIAAttributeValue(
                 document.getElementById('checkbox')!, 'disabled'))
          .toEqual('true');
      expect(computeARIAAttributeValue(
                 document.getElementById('radio')!, 'disabled'))
          .toEqual('false');
    });
  });

  describe('for aria-selected', () => {
    it(`returns the default of null when element.selected isn't valid`, () => {
      render(
          html`
    <button id="button" role="checkbox"></button>
    <ul id="list"><li id="listitem">foo</li></ul>
    <table>
      <tr id="row"></tr>
    </table>
    <form><input type="button" id="input" value="foo"></form>
    `,
          container);

      expect(computeARIAAttributeValue(
                 document.getElementById('button')!, 'selected'))
          .toBeNull();
      expect(computeARIAAttributeValue(
                 document.getElementById('list')!, 'selected'))
          .toBeNull();
      expect(computeARIAAttributeValue(
                 document.getElementById('listitem')!, 'selected'))
          .toBeNull();
      expect(computeARIAAttributeValue(
                 document.getElementById('row')!, 'selected'))
          .toBeNull();
      expect(computeARIAAttributeValue(
                 document.getElementById('input')!, 'selected'))
          .toBeNull();
    });

    it(`returns the value of element.selected`, () => {
      render(
          html`
    <select>
      <option id="selected" selected>foo</option>
      <option id="not-selected">bar</option>
    </select>
    `,
          container);

      expect(computeARIAAttributeValue(
                 document.getElementById('selected')!, 'selected'))
          .toEqual('true');
      expect(computeARIAAttributeValue(
                 document.getElementById('not-selected')!, 'selected'))
          .toEqual('false');
    });
  });

  describe('for aria-level', () => {
    it('returns the heading for a heading element', () => {
      render(
          html`
    <h1 id="first">ein</h1>
    <h3 id="third">drei</h3>
    <h6 id="sixth">sechs</h6>
    `,
          container);

      expect(
          computeARIAAttributeValue(document.getElementById('first')!, 'level'))
          .toEqual('1');
      expect(
          computeARIAAttributeValue(document.getElementById('third')!, 'level'))
          .toEqual('3');
      expect(
          computeARIAAttributeValue(document.getElementById('sixth')!, 'level'))
          .toEqual('6');
    });

    it('returns null for non-heading elements', () => {
      render(
          html`
      <div id="div">foo</div>
      <button id="button">bar</button>
      <ul id="ul"><li>baz</li></ul>
    `,
          container);

      expect(
          computeARIAAttributeValue(document.getElementById('div')!, 'level'))
          .toBeNull();
      expect(computeARIAAttributeValue(
                 document.getElementById('button')!, 'level'))
          .toBeNull();
      expect(computeARIAAttributeValue(document.getElementById('ul')!, 'level'))
          .toBeNull();
    });
  });

  describe('for aria-readonly', () => {
    it(`returns the value of element.readonly on an input`, () => {
      render(
          html`
    <form>
      <input type="checkbox" id="readonly" readonly value="foo">
      <input type="radio" id="not-readonly" value="bar">
    </form>
    `,
          container);

      expect(computeARIAAttributeValue(
                 document.getElementById('readonly')!, 'readonly'))
          .toEqual('true');
      expect(computeARIAAttributeValue(
                 document.getElementById('not-readonly')!, 'readonly'))
          .toEqual('false');
    });

    it(`returns true if contentEditable is false`, () => {
      render(
          html`
    <button id="button" role="checkbox"></button>
    <ul id="list"><li id="listitem">foo</li></ul>
    <table id="table" contenteditable="false">
      <tr id="first-row"></tr>
      <tr id="second-row" contenteditable="true"></tr>
    </table>
    <form><input type="button" id="input" contenteditable="false" value="foo"></form>
    `,
          container);

      expect(computeARIAAttributeValue(
                 document.getElementById('button')!, 'readonly'))
          .toEqual('false');
      expect(computeARIAAttributeValue(
                 document.getElementById('list')!, 'readonly'))
          .toEqual('false');
      expect(computeARIAAttributeValue(
                 document.getElementById('listitem')!, 'readonly'))
          .toEqual('false');
      expect(computeARIAAttributeValue(
                 document.getElementById('table')!, 'readonly'))
          .toEqual('true');
      expect(computeARIAAttributeValue(
                 document.getElementById('first-row')!, 'readonly'))
          .toEqual('false');
      expect(computeARIAAttributeValue(
                 document.getElementById('second-row')!, 'readonly'))
          .toEqual('false');
      expect(computeARIAAttributeValue(
                 document.getElementById('input')!, 'readonly'))
          .toEqual('true');
    });
  });

  describe('for aria-colindex', () => {
    it(`returns the default of null when element.colindex isn't valid`, () => {
      render(
          html`
    <button id="button" role="checkbox"></button>
    <ul id="list"><li id="listitem">foo</li></ul>
    <table>
      <tr id="row"></tr>
    </table>
    <form><input type="button" id="input">foo</input></form>
    `,
          container);

      expect(computeARIAAttributeValue(
                 document.getElementById('button')!, 'colindex'))
          .toBeNull();
      expect(computeARIAAttributeValue(
                 document.getElementById('list')!, 'colindex'))
          .toBeNull();
      expect(computeARIAAttributeValue(
                 document.getElementById('listitem')!, 'colindex'))
          .toBeNull();
      expect(computeARIAAttributeValue(
                 document.getElementById('row')!, 'colindex'))
          .toBeNull();
      expect(computeARIAAttributeValue(
                 document.getElementById('input')!, 'colindex'))
          .toBeNull();
    });

    it(`returns the correct index for the nth columnheader or cell within a
    row`,
       () => {
         render(
             html`
    <table>
      <tr>
        <th id="first" role="columnheader">foo</th>
        <td id="second">bar</td>
      </tr>
    </table>
    `,
             container);

         expect(computeARIAAttributeValue(
                    document.getElementById('first')!, 'colindex'))
             .toEqual('1');
         expect(computeARIAAttributeValue(
                    document.getElementById('second')!, 'colindex'))
             .toEqual('2');
       });
  });
  describe('for aria-rowindex', () => {
    it(`returns the default of null when element.rowindex isn't valid`, () => {
      render(
          html`
    <button id="button" role="checkbox"></button>
    <ul id="list"><li id="listitem">foo</li></ul>
    <table>
      <tr><td id="cell">foo</td></tr>
    </table>
    <form><input type="button" id="input">foo</input></form>
    `,
          container);

      expect(computeARIAAttributeValue(
                 document.getElementById('button')!, 'rowindex'))
          .toBeNull();
      expect(computeARIAAttributeValue(
                 document.getElementById('list')!, 'rowindex'))
          .toBeNull();
      expect(computeARIAAttributeValue(
                 document.getElementById('listitem')!, 'rowindex'))
          .toBeNull();
      expect(computeARIAAttributeValue(
                 document.getElementById('cell')!, 'rowindex'))
          .toBeNull();
      expect(computeARIAAttributeValue(
                 document.getElementById('input')!, 'rowindex'))
          .toBeNull();
    });

    it(`returns the correct index for the nth row or rowheader within a table`,
       () => {
         render(
             html`
    <table>
      <thead><tr id="first">foo</tr></thead>
      <tr id="second">
        <th>foo</th>
        <td>bar</td>
        <div role="cell">baz</div>
      </tr>
    </table>
    `,
             container);

         expect(computeARIAAttributeValue(
                    document.getElementById('first')!, 'rowindex'))
             .toEqual('1');
         expect(computeARIAAttributeValue(
                    document.getElementById('second')!, 'rowindex'))
             .toEqual('2');
       });
  });

  describe('for aria-posinset', () => {
    it(`returns the default of null when element.posinset isn't valid`, () => {
      render(
          html`
    <button id="button" role="checkbox"></button>
    <ul id="list"><li>foo</li></ul>
    <table>
      <tr><td id="cell">foo</td></tr>
    </table>
    <form><input type="button" id="input">foo</input></form>
    `,
          container);

      expect(computeARIAAttributeValue(
                 document.getElementById('button')!, 'posinset'))
          .toBeNull();
      expect(computeARIAAttributeValue(
                 document.getElementById('list')!, 'posinset'))
          .toBeNull();
      expect(computeARIAAttributeValue(
                 document.getElementById('cell')!, 'posinset'))
          .toBeNull();
      expect(computeARIAAttributeValue(
                 document.getElementById('input')!, 'posinset'))
          .toBeNull();
    });

    it(`returns the correct index for the nth listitem within a list`, () => {
      render(
          html`
      <ul>
        <li id="first">foo</li>
        <div role="listitem" id="second">foo</div>
      </ul>
      `,
          container);

      expect(computeARIAAttributeValue(
                 document.getElementById('first')!, 'posinset'))
          .toEqual('1');
      expect(computeARIAAttributeValue(
                 document.getElementById('second')!, 'posinset'))
          .toEqual('2');
    });

    it(`returns the correct index for the nth treeitem within a tree`, () => {
      render(
          html`
      <div role="tree">
        <div role="treeitem" id="first">foo</div>
        <div role="treeitem" id="second">foo</div>
      </div>
      `,
          container);

      expect(computeARIAAttributeValue(
                 document.getElementById('first')!, 'posinset'))
          .toEqual('1');
      expect(computeARIAAttributeValue(
                 document.getElementById('second')!, 'posinset'))
          .toEqual('2');
    });
  });
});
