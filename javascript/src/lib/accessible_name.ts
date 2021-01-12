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
