/**
 * @license
 * Copyright 2021 The Semantic Locators Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import {getRole, positionWithinAncestorRole} from './role';
import {SupportedAttributeType} from './types';
import {checkExhaustive, hasTagName} from './util';

/**
 * Get the value of an ARIA attribute on a HTMLElement. Include implicit values
 * (e.g. `<input checked>` implies `aria-checked="true"`). Returns values
 * according to https://www.w3.org/WAI/PF/aria-1.1/states_and_properties, but
 * returning null rather than undefined if the attribute isn't defined for the
 * element.
 */
export function computeARIAAttributeValue(
    element: HTMLElement,
    attribute: SupportedAttributeType,
    ): string|null {
  if (element.hasAttribute(`aria-${attribute}`)) {
    return element.getAttribute(`aria-${attribute}`);
  }

  // Check native HTML equivalents
  switch (attribute) {
    // States:
    case 'checked':
      if (hasTagName(element, 'input') &&
          ['checkbox', 'radio'].includes(element.type)) {
        return element.checked.toString();
      }
      return null;
    case 'current':
      // There's no native equivalent of "aria-current" so if it's not
      // explicitly specified it takes the default of false.
      return 'false';
    case 'disabled':
      return ((hasTagName(element, 'button') ||
               hasTagName(element, 'fieldset') ||
               hasTagName(element, 'input') ||
               hasTagName(element, 'optgroup') ||
               hasTagName(element, 'option') || hasTagName(element, 'select') ||
               hasTagName(element, 'textarea')) &&
              element.disabled)
          .toString();
    case 'pressed':
      // There's no native equivalent of "aria-pressed" so if it's not
      // explicitly specified it takes the default of false.
      return 'false';
    case 'selected':
      if (hasTagName(element, 'option')) {
        return element.selected.toString();
      }
      return null;

    // Properties:
    case 'colindex':
      const colindex =
          positionWithinAncestorRole(element, 'row', ['columnheader', 'cell']);
      return colindex ? String(colindex) : null;
    case 'level':
      const match = element.tagName.match(/^H([1-6])$/);
      if (match === null) {
        return null;
      }
      return match[1];
    case 'rowindex':
      const rowindex = positionWithinAncestorRole(element, 'table', ['row']);
      return rowindex ? String(rowindex) : null;
    case 'posinset':
      const role = getRole(element);
      if (role === 'listitem') {
        const posinset =
            positionWithinAncestorRole(element, 'list', ['listitem']);
        return posinset ? String(posinset) : null;
      } else if (role === 'treeitem') {
        const posinset =
            positionWithinAncestorRole(element, 'tree', ['treeitem']);
        return posinset ? String(posinset) : null;
      } else {
        return null;
      }
    case 'readonly':
      return ((hasTagName(element, 'input') && element.readOnly) ||
              // TODO(alexlloyd) is this correct?
              // https://www.w3.org/TR/html-aria/#docconformance says that
              // aria-readonly="false" for an 'Element with contenteditable
              // attribute', but surely an element with contenteditable="true"
              // is not readonly?
              element.contentEditable === 'false')
          .toString();
    default:
      checkExhaustive(attribute);
  }
}
