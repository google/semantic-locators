/**
 * @license
 * Copyright 2021 The Semantic Locators Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import {CHILDREN_PRESENTATIONAL, isAriaOnlyRole, ROLE_MAP} from '../../src/lib/role_map';

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
