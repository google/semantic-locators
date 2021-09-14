/**
 * @license
 * Copyright 2021 The Semantic Locators Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import {getAccessibleName} from 'accname';

import {cachedDuringBatch} from './batch_cache';
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
  // TODO(alexlloyd) support escaping * to use in the accname (then this logic
  // should probably be moved to the pegjs parser)
  const nameParts = expected.split('*');

  // If the expected string doesn't start/end with * then we must check the
  // start/end of the actual value
  if (!actual.startsWith(nameParts[0]) ||
      !actual.endsWith(nameParts[nameParts.length - 1])) {
    return false;
  }

  let currentIndex = 0;
  for (const part of nameParts) {
    currentIndex = actual.indexOf(part, currentIndex);
    if (currentIndex === -1) {
      return false;
    }
    currentIndex += part.length;
  }
  return true;
}

/**
 * Return the accessible name for the given element according to
 * https://www.w3.org/TR/accname-1.1/
 */
export const getNameFor =
    cachedDuringBatch((el: HTMLElement) => getAccessibleName(el));
