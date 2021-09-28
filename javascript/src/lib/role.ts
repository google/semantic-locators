/**
 * @license
 * Copyright 2021 The Semantic Locators Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import {AriaRole, CHILDREN_PRESENTATIONAL, IGNORED_ROLES, IMPLICIT_ROLES_FOR_TAGNAME, ImplicitRole, isAriaOnlyRole, isAriaRole, isImplicitRole, ROLE_MAP} from './role_map';
import {hasDataInColumn, hasDataInRow} from './table';
import {Condition, ConditionType} from './types';
import {checkExhaustive, compareNodeOrder} from './util';

/**
 * Return, in document order, a list of elements below the contextNode which
 * have the given role.
 */
export function findByRole(
    role: AriaRole,
    contextNode: HTMLElement,
    includeHidden: boolean,
    includePresentational: boolean,
    ): HTMLElement[] {
  const explicitSelector = `[role="${role}"]`;
  const matchExplicitSelector =
      Array.from(contextNode.querySelectorAll<HTMLElement>(explicitSelector));

  if (isAriaOnlyRole(role)) {
    return matchExplicitSelector.filter(el => includeHidden || !isHidden(el))
        .filter(el => includePresentational || !isPresentationalChild(el));
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
  return arrayFrom(elements)
      .filter(el => includeHidden || !isHidden(el))
      .filter(el => includePresentational || !isPresentationalChild(el))
      .sort(compareNodeOrder);
}

/** Calculate the role for the given element based on the rules in roleMap. */
export function getRole(element: HTMLElement): AriaRole|null {
  const explicitRole = element.getAttribute('role');
  if (explicitRole !== null) {
    if (IGNORED_ROLES.includes(explicitRole)) {
      return null;
    }
    if (!isAriaRole(explicitRole)) {
      // TODO(b/201268511) assert or throw for invalid role attribute
      return null;
    }
    return explicitRole;
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
      descendantRoles.flatMap(role => findByRole(role, ancestor, false, false))
          .filter(
              descendant => ancestor ===
                  closestWithRole(descendant.parentElement!, ancestorRole))
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
 * Check whether `element` has any ancestors with a presentational children
 * role, implying that `element` is presentational.
 * https://www.w3.org/TR/wai-aria-practices/#children_presentational
 */
function isPresentationalChild(element: HTMLElement): boolean {
  return closestChildrenPresentationalAncestor(element) !== null;
}

const CHILDREN_PRESENTATIONAL_SELECTOR =
    CHILDREN_PRESENTATIONAL.map(selectorForAncestorRole).join(',');

/**  Returns the closest element which has presentational children. */
export function closestChildrenPresentationalAncestor(element: HTMLElement):
    HTMLElement|null {
  if (element.parentElement) {
    return closest(element.parentElement, CHILDREN_PRESENTATIONAL_SELECTOR);
  }
  return null;
}

function closestWithRole(element: HTMLElement, role: AriaRole): HTMLElement|
    null {
  return closest(element, selectorForAncestorRole(role));
}

/**
 * Returns a selector matching any *ancestor* element with a role of `role`.
 *
 * This is not implemented for all roles - it throws an error if a
 * conditionalSelector has conditions which must be checked. With the roles for
 * which it is implemented, it is only suitable for using to find closest
 * ancestors, and won't return complete results if used in another way
 */
function selectorForAncestorRole(role: AriaRole) {
  let selector = `[role="${role}"]`;

  if (isImplicitRole(role)) {
    const implicitDefinition = ROLE_MAP[role];
    if (implicitDefinition.exactSelector !== undefined) {
      selector += ',' + noExplicitRole(implicitDefinition.exactSelector);
    }

    for (const conditionalSelector of implicitDefinition.conditionalSelectors ??
         []) {
      // Check if an element which matches this selector can have
      // children. If it cannot then we don't need to check for that
      // element as an ancestor. The condition is very crude, but is the
      // only way we can hit this code path. A test in role_map_test.ts
      // verifies this.
      if (canHaveChildren(conditionalSelector.greedySelector)) {
        throw new Error(
            `Not implemented: closestWithRole called with a role which requires a condition to be checked. Role: ${
                role}; Selector: ${implicitDefinition}`);
      }
    }
  }
  return selector;
}

/**
 * Whether an element matching this selector may have child nodes. This
 * function is incomplete, only covering greedySelectors for roles where some
 * code path leads to `closestWithRole` being called for that role.
 */
function canHaveChildren(selector: string): boolean {
  return selector !== 'input';
}

/**
 * Find all elements matching the given `selector` in document order.
 */
function resolveImplicitSelector(
    selector: string,
    contextNode: HTMLElement,
    conditions?: readonly Condition[],
    ): HTMLElement[] {
  // Ignore elements with explicit `role` attribute.
  const elements = Array.from(
      contextNode.querySelectorAll<HTMLElement>(noExplicitRole(selector)));

  if (conditions) {
    return elements.filter(
        el => conditions.every(c => evaluateCondition(el, c)));
  }
  return elements;
}

function noExplicitRole(selector: string): string {
  return selector.split(',').map(s => `${s}:not([role])`).join(',');
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

/** Polyfill of `Array.from` for `Set`s in IE11. */
function arrayFrom<T>(set: Set<T>): T[] {
  const result: T[] = new Array();
  for (const value of set) {
    result.push(value);
  }
  return result;
}

export const TEST_ONLY = {
  evaluateCondition,
  arrayFrom
};
