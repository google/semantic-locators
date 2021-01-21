/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {AriaRole, IGNORED_ROLES, IMPLICIT_ROLES_FOR_TAGNAME, ImplicitRole, isAriaOnlyRole, isAriaRole, ROLE_MAP} from './role_map';
import {hasDataInColumn, hasDataInRow} from './table';
import {Condition, ConditionType} from './types';
import {checkExhaustive, compareNodeOrder, debug} from './util';

/**
 * Return, in document order, a list of elements below the contextNode which
 * have the given role.
 */
export function findByRole(
    role: AriaRole,
    contextNode: HTMLElement,
    includeHidden: boolean,
    ): HTMLElement[] {
  const explicitSelector = `[role="${role}"]`;
  const matchExplicitSelector =
      Array.from(contextNode.querySelectorAll<HTMLElement>(explicitSelector));

  if (isAriaOnlyRole(role)) {
    return matchExplicitSelector.filter(el => includeHidden || !isHidden(el));
  }

  const elements = new Set(matchExplicitSelector);


  const implicitDefinition = ROLE_MAP[role];

  const exactSelector = implicitDefinition.exactSelector;
  if (exactSelector) {
    const matchExactSelector =
        resolveImplicitSelector(exactSelector, contextNode);
    for (const element of matchExactSelector) {
      elements.add(element);
    }
  }

  for (const selector of implicitDefinition.conditionalSelectors ?? []) {
    const matchConditionalSelector = resolveImplicitSelector(
        selector.greedySelector, contextNode, selector.conditions);
    for (const element of matchConditionalSelector) {
      elements.add(element);
    }
  }

  // TODO(alexlloyd) this could be optimised with a k-way merge removing
  // duplicates rather than concat + sort in separate steps.
  return Array.from(elements)
      .filter(el => includeHidden || !isHidden(el))
      .sort(compareNodeOrder);
}

/** Calculate the role for the given element based on the rules in roleMap. */
export function getRole(
    element: HTMLElement,
    ): AriaRole|null {
  const explicitRole = element.getAttribute('role');
  if (explicitRole) {
    if (IGNORED_ROLES.includes(explicitRole)) {
      return null;
    }
    if (isAriaRole(explicitRole)) {
      return explicitRole;
    }
  }

  const tagName = element.tagName.toLowerCase();
  const potentialRoles = IMPLICIT_ROLES_FOR_TAGNAME[tagName] ?? [];
  return potentialRoles.find(role => matchesImplicitRole(element, role)) ||
      null;
}

/** Whether `el` is hidden and thus not visible in the tree. */
export function isHidden(el: Element): boolean {
  if (window.getComputedStyle(el).visibility === 'hidden' ||
      closest(el, '[aria-hidden="true"]') !== null) {
    return true;
  }

  let ancestor: Element|null = el;
  while (ancestor !== null) {
    if (window.getComputedStyle(ancestor).display === 'none') {
      return true;
    }
    ancestor = ancestor.parentElement;
  }
  return false;
}


/** Returns whether `condition` is true for `element`. */
function evaluateCondition(
    element: HTMLElement, condition: Condition): boolean {
  switch (condition.type) {
    case ConditionType.ATTRIBUTE_VALUE_GREATER_THAN: {
      const value = element.getAttribute(condition.attribute);
      return value !== null && Number(value) > condition.value;
    }

    case ConditionType.ATTRIBUTE_VALUE_LESS_THAN: {
      const value = element.getAttribute(condition.attribute);
      return value !== null && Number(value) < condition.value;
    }

    case ConditionType.HAS_ACCESSIBLE_NAME:
      // HasAccessibleName condition only applies to landmark roles, so the full
      // accname computation isn't necessary
      return element.hasAttribute('aria-label') ||
          (element.hasAttribute('aria-labelledby') &&
           element.getAttribute('aria-labelledby')!.split(' ').some(
               id => document.getElementById(id) !== undefined));

    case ConditionType.FORBIDDEN_ANCESTORS:
      return closest(element, condition.forbiddenAncestorSelector) === null;

    case ConditionType.PROPERTY_TAKES_BOOL_VALUE:
      return element[condition.propertyName] === condition.value;

    case ConditionType.PROPERTY_TAKES_ONE_OF_STRING_VALUES: {
      const untypedElement = element as unknown as {[property: string]: string};
      return condition.values.some(
          value => value === untypedElement[condition.propertyName]);
    }

    case ConditionType.CLOSEST_ANCESTOR_TAG_HAS_ROLE: {
      const parent = element.parentElement;
      if (parent === null) {
        return false;
      }
      const closestElement = closest(parent, condition.tag);
      return closestElement !== null &&
          getRole(closestElement) === condition.role;
    }

    case ConditionType.DATA_IN_COLUMN: {
      const table = closest(element, 'table');
      if (table === null) {
        return false;
      }
      return condition.dataInColumn ===
          hasDataInColumn(
                 table as HTMLTableElement, element as HTMLTableCellElement);
    }

    case ConditionType.DATA_IN_ROW: {
      const table = closest(element, 'table');
      if (table === null) {
        return false;
      }
      return condition.dataInRow ===
          hasDataInRow(
                 table as HTMLTableElement, element as HTMLTableCellElement);
    }

    default:
      checkExhaustive(condition);
  }
}

/**
 * Returns n where `element` is the nth element which has a role in
 * `descendantRoles` within it's closest ancestor with a role of
 * `ancestorRole`. e.g. if `element` is the 3rd row within a table,
 * `positionWithinAncestorRole(element, ['row'], 'table') === 3`.
 *
 * Returns null if element's role isn't in `descendantRoles` or if there is no
 * ancestor `ancestorRole`.
 */
export function positionWithinAncestorRole(
    element: HTMLElement,
    ancestorRole: AriaRole,
    descendantRoles: AriaRole[],
    ): number|null {
  const ancestor = closestWithRole(element.parentElement!, ancestorRole);

  if (ancestor === null) {
    return null;
  }

  const index =
      descendantRoles.flatMap(role => findByRole(role, ancestor, false))
          .filter(
              descendant =>
                  closestWithRole(descendant.parentElement!, ancestorRole) ===
                  ancestor)
          .sort(compareNodeOrder)
          .indexOf(element);
  // `indexOf` is 0-indexed but the ARIA attributes are 1-indexed
  return index + 1 || null;
}

function matchesImplicitRole(
    element: HTMLElement, role: ImplicitRole): boolean {
  const implicitDefinition = ROLE_MAP[role];
  const exactSelector = implicitDefinition.exactSelector;
  if (exactSelector && matches(element, exactSelector)) {
    return true;
  }

  return implicitDefinition.conditionalSelectors?.some(
             selector => matches(element, selector.greedySelector) &&
                 selector.conditions.every(
                     condition => evaluateCondition(element, condition))) ??
      false;
}

/**
 * Finds the closest ancestor element to `element` with role `role`. This
 * function is analogous to `Node.closest` as `findByRole` is analogous to
 * `Element.querySelectorAll`.
 */
function closestWithRole(element: HTMLElement, role: AriaRole): HTMLElement|
    null {
  const explicitSelector = `[role="${role}"]`;
  const matchExplicitSelector = closest(element, explicitSelector);

  if (isAriaOnlyRole(role)) {
    return matchExplicitSelector;
  }

  let closestFound = matchExplicitSelector;

  const implicitDefinition = ROLE_MAP[role];

  const exactSelector = implicitDefinition.exactSelector;
  if (exactSelector) {
    closestFound = inner(
        closestFound,
        closest(
            element,
            exactSelector.split(',').map(s => `${s}:not([role])`).join(',')));
  }

  if (debug() && implicitDefinition.conditionalSelectors !== undefined &&
      implicitDefinition.conditionalSelectors.length > 0) {
    throw new Error(
        `Not implemented: closestWithRole called with a role which requires a condition. Role: ${
            role}; Selector: ${implicitDefinition}`);
  }

  return closestFound;
}

/** Find all elements matching the given `selector` in document order. */
function resolveImplicitSelector(
    selector: string,
    contextNode: HTMLElement,
    conditions?: readonly Condition[],
    ): HTMLElement[] {
  // Ignore elements with explicit `role` attribute.
  const elements = Array.from(contextNode.querySelectorAll<HTMLElement>(
      selector.split(',').map(s => `${s}:not([role])`).join(',')));

  if (conditions) {
    return elements.filter(
        el => conditions.every(c => evaluateCondition(el, c)));
  }
  return elements;
}

/**
 * Returns whichever element is inside the other. If one argument is null,
 * return the other argument.
 */
function inner(a: HTMLElement|null, b: HTMLElement|null): HTMLElement|null {
  if (a === null) {
    return b;
  } else if (b === null) {
    return a;
  } else if (a.contains(b)) {
    return b;
  } else if (b.contains(a)) {
    return a;
  } else {
    throw new Error(`The elements ${a} and ${
        b} are not anctors/descendants of each other.`);
  }
}


/** `element.matches(selector)` with a polyfill for IE */
function matches(element: Element, selector: string): boolean {
  interface IEElement extends Element {
    msMatchesSelector(selectors: string): boolean;
  }

  return element.matches?.(selector) ??
      (element as IEElement).msMatchesSelector?.(selector) ??
      element.webkitMatchesSelector(selector);
}


/** `element.closest(selector)` with a polyfill for IE */
function closest(element: HTMLElement, selector: string): HTMLElement|null;
function closest(element: Element, selector: string): Element|null;
function closest(element: Element, selector: string): Element|null {
  if (element.closest) {
    return element.closest(selector);
  }

  while (!matches(element, selector)) {
    if (element.parentElement === null) {
      return null;
    }
    element = element.parentElement;
  }
  return element;
}

export const TEST_ONLY = {evaluateCondition};
