/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {getAccessibleName} from 'accname';

import {ValueError} from './error';


/**
 * Check if `actual` matches `expected`, where `expected` can include leading
 * and trailing wildcards.
 */
export function nameMatches(expected: string, actual: string): boolean {
  if (expected === '*') {
    throw new ValueError(
        '* is invalid as an accessible name. To match any ' +
        'accessible name omit it from the locator e.g. {button}.');
  }
  if (expected.startsWith('*') && expected.endsWith('*')) {
    return actual.includes(expected.slice(1, -1));
  }
  if (expected.startsWith('*')) {
    return actual.endsWith(expected.slice(1));
  }
  if (expected.endsWith('*')) {
    return actual.startsWith(expected.slice(0, -1));
  }
  return actual === expected;
}

/**
 * Return the accessible name for the given element according to
 * https://www.w3.org/TR/accname-1.1/
 */
export function getNameFor(element: HTMLElement): string {
  return getAccessibleName(element);
}
