/**
 * @license
 * Copyright 2021 The Semantic Locators Authors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Common types used across semantic locators.
 */

/**
 * The native selector definition(s) to match elements with a specific role. If
 * `exactSelector` is present then any element which matches it as a CSS
 * selector has the relevant role. An element is matched when either
 * `exactSelector` or at least one of `conditionalSelectors` matches.
 */
export interface RoleSelector {
  readonly exactSelector?: string;
  readonly conditionalSelectors?: readonly ConditionalSelector[];
}

/**
 * Selector for a role. Elements must match `greedySelector` as a CSS selector
 * and all `conditions` must evaluate to true.
 */
export interface ConditionalSelector {
  readonly greedySelector: string;
  readonly conditions: readonly Condition[];
}

/**
 * The attributes (states and properties) currently supported by Semantic
 * Locators. These correspond to the ARIA states and properties at
 * https://www.w3.org/WAI/PF/aria/states_and_properties. The 'aria-' prefix is
 * dropped, so `checked` represents the `aria-checked` state.
 *
 * We will add more supported attributes as use cases arise - please file a bug
 * (internally) or a GitHub issue with your use case.
 */
export const SUPPORTED_ATTRIBUTES = [
  // States:
  'checked',
  'current',
  'disabled',
  'pressed',
  'selected',
  // Properties:
  'colindex',
  'level',
  'posinset',
  'readonly',
  'rowindex',
] as const;

/** Union type of all supported attributes. */
export type SupportedAttributeType = typeof SUPPORTED_ATTRIBUTES[number];

/**
 * Conditions which must be satisfied for HTML elements to take certain
 * explicit roles. These are the conditions which cannot be expressed as CSS
 * selectors.
 */
export type Condition =
    ForbiddenAncestors|AttributeValueLessThan|AttributeValueGreaterThan|
    HasAccessibleName|PropertyTakesBoolValue|PropertyTakesOneOfStringValues|
    ClosestAncestorTagHasRole|DataInRow|DataInColumn;

/** Type of `Condition` */
export enum ConditionType {
  PROPERTY_TAKES_BOOL_VALUE,
  FORBIDDEN_ANCESTORS,
  ATTRIBUTE_VALUE_GREATER_THAN,
  ATTRIBUTE_VALUE_LESS_THAN,
  HAS_ACCESSIBLE_NAME,
  PROPERTY_TAKES_ONE_OF_STRING_VALUES,
  CLOSEST_ANCESTOR_TAG_HAS_ROLE,
  DATA_IN_ROW,
  DATA_IN_COLUMN,
}

/** A property (IDL attribute) must take a certain boolean value. */
export interface PropertyTakesBoolValue {
  readonly type: ConditionType.PROPERTY_TAKES_BOOL_VALUE;
  readonly propertyName: keyof HTMLElement;
  readonly value: boolean;
}

/** A condition forbidding ancestors matching a certain selector. */
export interface ForbiddenAncestors {
  readonly type: ConditionType.FORBIDDEN_ANCESTORS;
  readonly forbiddenAncestorSelector: string;
}

/** The value of an attribute must be greater than a certain value. */
export interface AttributeValueGreaterThan {
  readonly type: ConditionType.ATTRIBUTE_VALUE_GREATER_THAN;
  readonly attribute: string;
  readonly value: number;
}

/** The value of an attribute must be less than a certain value. */
export interface AttributeValueLessThan {
  readonly type: ConditionType.ATTRIBUTE_VALUE_LESS_THAN;
  readonly attribute: string;
  readonly value: number;
}

/** The element must have an accessible name. */
export interface HasAccessibleName {
  readonly type: ConditionType.HAS_ACCESSIBLE_NAME;
}

/** A property must take one of a list of values. */
export interface PropertyTakesOneOfStringValues {
  readonly type: ConditionType.PROPERTY_TAKES_ONE_OF_STRING_VALUES;
  readonly propertyName: string;
  readonly values: readonly string[];
}

/** The closest <tag> element must have the given role. */
export interface ClosestAncestorTagHasRole {
  readonly type: ConditionType.CLOSEST_ANCESTOR_TAG_HAS_ROLE;
  readonly tag: keyof HTMLElementTagNameMap;
  readonly role: string;
}

/**
 * If the containing table has data in slots which overlap with the
 * y-coordinates of the target element.
 * https://html.spec.whatwg.org/multipage/tables.html#column-header
 */
export interface DataInRow {
  readonly type: ConditionType.DATA_IN_ROW;
  readonly dataInRow: boolean;
}

/**
 * If the containing table has data in slots which overlap with the
 * x-coordinates of the target element.
 * https://html.spec.whatwg.org/multipage/tables.html#column-header
 */
export interface DataInColumn {
  readonly type: ConditionType.DATA_IN_COLUMN;
  readonly dataInColumn: boolean;
}

/** A quote character. */
export type QuoteChar = `'`|'"';
