/**
 * @license
 * Copyright 2021 The Semantic Locators Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import {html, render} from 'lit';

import {findByRole, getRole, positionWithinAncestorRole, TEST_ONLY} from '../../src/lib/role';
import {ConditionType, PropertyTakesBoolValue} from '../../src/lib/types';

const {arrayFrom, evaluateCondition} = TEST_ONLY;

let container: HTMLElement;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
});

afterEach(() => {
  document.body.removeChild(container);
});

describe('findByRole', () => {
  it('finds by explicit roles', () => {
    render(
        html`
    <div id="foo" role="button"></div>
    <button id="bar" role="checkbox"></button>`,
        container);
    expect(findByRole('button', container, false, false)).toEqual([
      document.getElementById('foo')!
    ]);
    expect(findByRole('checkbox', container, false, false)).toEqual([
      document.getElementById('bar')!
    ]);
  });

  it('finds relative to the contextNode', () => {
    render(
        html`
    <div id="context-node">
      <div id="foo" role="button"></div>
    </div>
    <div role="button"></div>`,
        container);
    expect(
        findByRole(
            'button', document.getElementById('context-node')!, false, false))
        .toEqual([document.getElementById('foo')!]);
  });

  it('finds by implicit roles with exactSelector', () => {
    render(
        html`
    <button id="foo"></button>
    <input type="submit" id="bar">
    <ul><li id="baz"></li></ul>
    <table><div><td id="qux">blah</td></div></table>
    <input type="email" list="my-list-id" id="toto">
    <datalist id="my-list-id"><option value="only-option"></option></datalist>
    <input id='tutu'>`,
        container);
    expect(findByRole('button', container, false, false)).toEqual([
      document.getElementById('foo')!,
      document.getElementById('bar')!,
    ]);
    expect(findByRole('listitem', container, false, false)).toEqual([
      document.getElementById('baz')!
    ]);
    expect(findByRole('cell', container, false, false)).toEqual([
      document.getElementById('qux')!
    ]);
    expect(findByRole('combobox', container, false, false)).toEqual([
      document.getElementById('toto')!
    ]);
    expect(findByRole('textbox', container, false, false)).toEqual([
      document.getElementById('tutu')!
    ]);
  });

  it('finds by implicit roles with conditionalSelector', () => {
    render(
        html`
    <header id="foo">blah</header>
    <article><header>blah</header></article>
    <div role="article"><header>blah</header></div>
    <select size="1" id="bar"></select>
    <select size="2" id="baz"></select>
    <section aria-label="anything" id="qux"></section>
    <section></section>`,
        container);
    expect(findByRole('banner', container, false, false)).toEqual([
      document.getElementById('foo')!
    ]);
    expect(findByRole('combobox', container, false, false)).toEqual([
      document.getElementById('bar')!
    ]);
    expect(findByRole('listbox', container, false, false)).toEqual([
      document.getElementById('baz')!
    ]);
    expect(findByRole('region', container, false, false)).toEqual([
      document.getElementById('qux')!
    ]);
  });

  it('excludes hidden elements if `includeHidden = false`', () => {
    render(
        html`
        <ul aria-hidden="true">
          <li>OK</li>
        </ul>
        <ul style="visibility:hidden;">
          <li>OK</li>
        </ul>
        <ul id="foo">
          <li style="display:none;">OK</li>
          <li id="bar">OK</li>
        </ul>
        <div role="search" style="display:none;">My Cool search</div>
        `,
        container);
    expect(findByRole('list', container, false, false)).toEqual([
      document.getElementById('foo')!
    ]);
    expect(findByRole('listitem', container, false, false)).toEqual([
      document.getElementById('bar')!
    ]);
    expect(findByRole('search', container, false, false)).toEqual([]);
  });

  it('includes hidden elements if `includeHidden = true`', () => {
    render(
        html`
        <ul aria-hidden="true">
          <li>OK</li>
        </ul>
        <ul style="visibility:hidden;">
          <li>OK</li>
        </ul>
        <ul>
          <li style="display:none;">OK</li>
          <li>OK</li>
        </ul>
        <div id="foo" role="search" style="display:none;">My Cool search</div>
        `,
        container);
    expect(findByRole('list', container, true, false))
        .toEqual(Array.from(container.querySelectorAll('ul')));
    expect(findByRole('listitem', container, true, false))
        .toEqual(Array.from(container.querySelectorAll('li')));
    expect(findByRole('search', container, true, false)).toEqual([
      document.getElementById('foo')!
    ]);
  });

  it('excludes descendants of roles with presentational children if `includePresentational = false`',
     () => {
       render(
           html`
        <div role="button" id="foo">
          <div><div role="button">Inner</div></div>
        </div>
        `,
           container);
       expect(findByRole('button', container, false, false)).toEqual([
         document.getElementById('foo')!
       ]);
     });

  it('includes descendants of roles with presentational children if `includePresentational = true`',
     () => {
       render(
           html`
        <div role="button" id="foo">
          <div><div role="button" id="bar">Inner</div></div>
        </div>
        `,
           container);
       expect(findByRole('button', container, false, true)).toEqual([
         document.getElementById('foo')!, document.getElementById('bar')!
       ]);
     });
});

describe('getRole', () => {
  it('returns null for role-less elements', () => {
    render(
        html`
    <div id="foo"></div>
    <section id="bar"></section>
    <div role="article"><header id="baz">blah</header></div>
`,
        container);
    expect(getRole(document.getElementById('foo')!)).toBeNull();
    expect(getRole(document.getElementById('bar')!)).toBeNull();
    expect(getRole(document.getElementById('baz')!)).toBeNull();
  });

  it('returns null for role=presentation or none', () => {
    render(
        html`
    <button role="presentation" id="foo">OK</button>
    <button role="none" id="bar">OK</button>
`,
        container);
    expect(getRole(document.getElementById('foo')!)).toBeNull();
    expect(getRole(document.getElementById('bar')!)).toBeNull();
  });

  it('returns null for invalid roles', () => {
    render(
        html`
    <div id="foo">foo</div>
    <button id="bar">bar</button>
    <button id="baz">baz</button>
    `,
        container);
    const fooElement = document.getElementById('foo')!;
    const barElement = document.getElementById('bar')!;
    const bazElement = document.getElementById('baz')!;
    // setAttribute as lit-plugin doesn't allow invalid roles in html strings
    fooElement.setAttribute('role', 'buton');
    barElement.setAttribute('role', 'buton');
    bazElement.setAttribute('role', '');

    expect(getRole(fooElement)).toBeNull();
    expect(getRole(barElement)).toBeNull();
    expect(getRole(bazElement)).toBeNull();
  });

  it('gets explicit roles', () => {
    render(
        html`
    <div id="foo" role="button"></div>
    <button id="bar" role="checkbox"></button>`,
        container);
    expect(getRole(document.getElementById('foo')!)).toEqual('button');
    expect(getRole(document.getElementById('bar')!)).toEqual('checkbox');
  });

  it('gets implicit roles', () => {
    render(
        html`
    <button id="foo"></button>
    <ul><li id="bar"></li></ul>
    <table><div><td id="baz">blah</td></div></table>
    <header id="qux">blah</header>
    <select size="1" id="toto"></select>
    <select size="2" id="tata"></select>
    <section aria-label="anything" id="titi"></section>`,
        container);
    expect(getRole(document.getElementById('foo')!)).toEqual('button');
    expect(getRole(document.getElementById('bar')!)).toEqual('listitem');
    expect(getRole(document.getElementById('baz')!)).toEqual('cell');
    expect(getRole(document.getElementById('qux')!)).toEqual('banner');
    expect(getRole(document.getElementById('toto')!)).toEqual('combobox');
    expect(getRole(document.getElementById('tata')!)).toEqual('listbox');
    expect(getRole(document.getElementById('titi')!)).toEqual('region');
  });
});

describe('evaluateCondition', () => {
  it(`for ForbiddenAncestors returns false if ancestor selector matches`,
     () => {
       render(
           html`
    <span><div id="baz"><div id="bar"><div
    id="foo"></div></div></div></span>`,
           container);
       expect(evaluateCondition(document.getElementById('foo')!, {
         type: ConditionType.FORBIDDEN_ANCESTORS,
         forbiddenAncestorSelector: 'span'
       })).toBeFalse();
       expect(evaluateCondition(document.getElementById('bar')!, {
         type: ConditionType.FORBIDDEN_ANCESTORS,
         forbiddenAncestorSelector: 'span'
       })).toBeFalse();
       expect(evaluateCondition(document.getElementById('baz')!, {
         type: ConditionType.FORBIDDEN_ANCESTORS,
         forbiddenAncestorSelector: 'span'
       })).toBeFalse();
       expect(evaluateCondition(document.getElementById('foo')!, {
         type: ConditionType.FORBIDDEN_ANCESTORS,
         forbiddenAncestorSelector: 'span'
       })).toBeFalse();
     });

  it(`for noAncestorTagsCondition returns true if ancestor selector doesn't match`,
     () => {
       render(html`<div><div><div id="foo"></div></div></div>`, container);
       expect(evaluateCondition(document.getElementById('foo')!, {
         type: ConditionType.FORBIDDEN_ANCESTORS,
         forbiddenAncestorSelector: 'span',
       })).toBeTrue();
     });

  it(`for AttributeValueGreaterThanCondition returns true if attribute value
  is greater than target`,
     () => {
       render(html`<input type="number" id="foo" max="100">`, container);
       expect(evaluateCondition(document.getElementById('foo')!, {
         type: ConditionType.ATTRIBUTE_VALUE_GREATER_THAN,
         attribute: 'max',
         value: 99,
       })).toBeTrue();
     });

  it(`for AttributeValueGreaterThanCondition returns false if attribute value
  is not greater than than target`,
     () => {
       render(html`<input type="number" id="foo" max="100">`, container);
       expect(evaluateCondition(document.getElementById('foo')!, {
         type: ConditionType.ATTRIBUTE_VALUE_GREATER_THAN,
         attribute: 'max',
         value: 101,
       })).toBeFalse();
       expect(evaluateCondition(document.getElementById('foo')!, {
         type: ConditionType.ATTRIBUTE_VALUE_GREATER_THAN,
         attribute: 'max',
         value: 100,
       })).toBeFalse();
     });

  it(`for AttributeValueGreaterThanCondition returns false if attribute is
  absent`,
     () => {
       render(html`<input type="number" id="foo">`, container);
       expect(evaluateCondition(document.getElementById('foo')!, {
         type: ConditionType.ATTRIBUTE_VALUE_GREATER_THAN,
         attribute: 'max',
         value: 99,
       })).toBeFalse();
     });

  it(`for AttributeValueLessThanCondition returns true if attribute value is
  not greater than than target`,
     () => {
       render(html`<input type="number" id="foo" max="100">`, container);
       expect(evaluateCondition(document.getElementById('foo')!, {
         type: ConditionType.ATTRIBUTE_VALUE_LESS_THAN,
         attribute: 'max',
         value: 101,
       })).toBeTrue();
     });

  it(`for AttributeValueLessThanCondition returns false if attribute value is
  not less than target`,
     () => {
       render(html`<input type="number" id="foo" max="100">`, container);
       expect(evaluateCondition(document.getElementById('foo')!, {
         type: ConditionType.ATTRIBUTE_VALUE_LESS_THAN,
         attribute: 'max',
         value: 99,
       })).toBeFalse();
       expect(evaluateCondition(document.getElementById('foo')!, {
         type: ConditionType.ATTRIBUTE_VALUE_LESS_THAN,
         attribute: 'max',
         value: 100,
       })).toBeFalse();
     });

  it(`for AttributeValueLessThanCondition returns true if attribute is
  absent`,
     () => {
       render(html`<input type="number" id="foo">`, container);
       expect(evaluateCondition(document.getElementById('foo')!, {
         type: ConditionType.ATTRIBUTE_VALUE_LESS_THAN,
         attribute: 'max',
         value: 99,
       })).toBeFalse();
     });

  it(`for HasAccessibleNameCondition returns true if element has an
  accessible name`,
     () => {
       render(html`<section id="foo" aria-label="abc">OK</section>`, container);
       expect(evaluateCondition(document.getElementById('foo')!, {
         type: ConditionType.HAS_ACCESSIBLE_NAME
       })).toBeTrue();
     });

  it(`for HasAccessibleNameCondition returns false if element doesn't have an
  accessible name`,
     () => {
       render(html`<section id="foo"></section>`, container);
       expect(evaluateCondition(document.getElementById('foo')!, {
         type: ConditionType.HAS_ACCESSIBLE_NAME
       })).toBeFalse();
     });

  it(`for PropertyTakesBoolValue returns true if property takes boolean value`,
     () => {
       render(
           html`
          <p id="foo">foo</p>
          <p id="bar" contenteditable="true">bar</p>
          <div contenteditable="true"><p id="baz">baz</p></div>
        `,
           container);
       const isContentEditable: PropertyTakesBoolValue = {
         type: ConditionType.PROPERTY_TAKES_BOOL_VALUE,
         propertyName: 'isContentEditable',
         value: true
       };
       expect(evaluateCondition(
                  document.getElementById('foo')!, isContentEditable))
           .toBeFalse();
       expect(evaluateCondition(
                  document.getElementById('bar')!, isContentEditable))
           .toBeTrue();
       expect(evaluateCondition(
                  document.getElementById('baz')!, isContentEditable))
           .toBeTrue();
     });

  it(`for PropertyTakesOneOfStringValues returns true if property value is in values`,
     () => {
       render(
           html`
         <input id="foo" type="text">
         <input id="bar">
         <input id="baz" type="number">
              `,
           container);
       expect(evaluateCondition(document.getElementById('foo')!, {
         type: ConditionType.PROPERTY_TAKES_ONE_OF_STRING_VALUES,
         propertyName: 'type',
         values: ['text']
       })).toBeTrue();
       expect(evaluateCondition(document.getElementById('bar')!, {
         type: ConditionType.PROPERTY_TAKES_ONE_OF_STRING_VALUES,
         propertyName: 'type',
         values: ['text']
       })).toBeTrue();
       expect(evaluateCondition(document.getElementById('baz')!, {
         type: ConditionType.PROPERTY_TAKES_ONE_OF_STRING_VALUES,
         propertyName: 'type',
         values: ['text']
       })).toBeFalse();
       expect(evaluateCondition(document.getElementById('baz')!, {
         type: ConditionType.PROPERTY_TAKES_ONE_OF_STRING_VALUES,
         propertyName: 'type',
         values: ['text', 'number']
       })).toBeTrue();
     });

  it(`for ClosestAncestorTagHasRole returns true if the closest element with tag has the specified role`,
     () => {
       render(
           html`
            <div role="region">
              <div role="list">
                <div role="listitem" id="foo"></div>
              </div>
            </div>
             `,
           container);
       expect(evaluateCondition(document.getElementById('foo')!, {
         type: ConditionType.CLOSEST_ANCESTOR_TAG_HAS_ROLE,
         tag: 'div',
         role: 'list'
       })).toBeTrue();
       expect(evaluateCondition(document.getElementById('foo')!, {
         type: ConditionType.CLOSEST_ANCESTOR_TAG_HAS_ROLE,
         tag: 'div',
         role: 'region'
       })).toBeFalse();
       expect(evaluateCondition(document.getElementById('foo')!, {
         type: ConditionType.CLOSEST_ANCESTOR_TAG_HAS_ROLE,
         tag: 'ul',
         role: 'list'
       })).toBeFalse();
     });

  it(`for DataInColumn returns whether there is data in the same column as the target`,
     () => {
       render(
           html`
             <table>
               <tr><th id="foo">h</th><th id="bar">h</th></tr>
               <tr><th>h</th><td>d</td></tr>
             </table>
           `,
           container);
       expect(evaluateCondition(document.getElementById('foo')!, {
         type: ConditionType.DATA_IN_COLUMN,
         dataInColumn: false
       })).toBeTrue();
       expect(evaluateCondition(document.getElementById('foo')!, {
         type: ConditionType.DATA_IN_COLUMN,
         dataInColumn: true
       })).toBeFalse();
       expect(evaluateCondition(document.getElementById('bar')!, {
         type: ConditionType.DATA_IN_COLUMN,
         dataInColumn: true
       })).toBeTrue();
       expect(evaluateCondition(document.getElementById('bar')!, {
         type: ConditionType.DATA_IN_COLUMN,
         dataInColumn: false
       })).toBeFalse();
     });

  it(`for DataInRow returns whether there is data in the same row as the target`,
     () => {
       render(
           html`
          <table>
            <tr><th id="foo">h</th><th>h</th></tr>
            <tr><th id="bar">h</th><td>d</td></tr>
          </table>
        `,
           container);
       expect(evaluateCondition(document.getElementById('foo')!, {
         type: ConditionType.DATA_IN_ROW,
         dataInRow: false
       })).toBeTrue();
       expect(evaluateCondition(document.getElementById('foo')!, {
         type: ConditionType.DATA_IN_ROW,
         dataInRow: true
       })).toBeFalse();
       expect(evaluateCondition(document.getElementById('bar')!, {
         type: ConditionType.DATA_IN_ROW,
         dataInRow: true
       })).toBeTrue();
       expect(evaluateCondition(document.getElementById('bar')!, {
         type: ConditionType.DATA_IN_ROW,
         dataInRow: false
       })).toBeFalse();
     });
});

describe('positionWithinAncestorRole', () => {
  it(`returns null if element doesn't have a role in descendantRoles`, () => {
    render(
        html`<div role="list"><div role="button" id="foo"></div></div>`,
        container);
    expect(positionWithinAncestorRole(document.getElementById('foo')!, 'list', [
      'listitem', 'heading'
    ])).toBeNull();
  });

  it('returns null if element has no ancestor with role ancestorRole', () => {
    render(
        html`<div role="list"><div role="button" id="foo"></div></div>`,
        container);
    expect(positionWithinAncestorRole(document.getElementById('foo')!, 'tree', [
      'button'
    ])).toBeNull();
  });

  it('returns the correct numbered element', () => {
    render(
        html`
          <div role="list">
            <div role="button" id="first"></div>
            <button id="second"></button>
            <div><div><input type="submit" id="third"></div></div>
          </div>`,
        container);
    expect(positionWithinAncestorRole(
               document.getElementById('first')!, 'list', ['button']))
        .toEqual(1);
    expect(positionWithinAncestorRole(
               document.getElementById('second')!, 'list', ['button']))
        .toEqual(2);
    expect(positionWithinAncestorRole(
               document.getElementById('third')!, 'list', ['button']))
        .toEqual(3);
  });

  it(`doesn't count elements in nested roles`, () => {
    render(
        html`
        <div role="table">
          <div role="row">
            <div role="cell">
              <div role="table">
                <div role="row">
                  <div role="cell">foo</div>
                </div>
              </div>
            </div>
            <div role="cell" id="second">bar</div>
          </div>
        </div>`,
        container);
    expect(positionWithinAncestorRole(
               document.getElementById('second')!, 'row', ['cell']))
        .toEqual(2);
  });
});

describe('arrayFrom is the inverse of `new Set()`', () => {
  it('for the empty set', () => {
    const input = new Set();
    expect(new Set(arrayFrom(input))).toEqual(input);
  });

  it('for a non-empty set', () => {
    const input = new Set(['a', 'b', 'c', 'd']);
    expect(new Set(arrayFrom(input))).toEqual(input);
  });
});
