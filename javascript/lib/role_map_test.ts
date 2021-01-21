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

import {CHILDREN_PRESENTATIONAL, isAriaOnlyRole, ROLE_MAP} from './role_map';

describe('CHILDREN_PRESENTATIONAL', () => {
  // If every role with presentational children is either:
  // (a) ARIA only;
  // (b) `exactSelector` only; or
  // (c) cannot have html descendants
  // Then we don't need to explicitly evaluate any conditions when checking for
  // presentational children as it can all be expressed with css selectors
  for (const role of CHILDREN_PRESENTATIONAL) {
    it(`role ${role} doesn't need explicit conditions to be checked`, () => {
      expect(
          isAriaOnlyRole(role) ||
          ROLE_MAP[role].conditionalSelectors === undefined ||
          // <input> cannot have html descendants
          ROLE_MAP[role].conditionalSelectors!.every(
              selector => selector.greedySelector === 'input'))
          .toBeTrue();
    });
  }
});
