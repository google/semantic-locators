/**
 * @license
 * Copyright 2021 The Semantic Locators Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import {InvalidLocatorError} from './error';
import {parse as pegParse} from './parser';
import {SemanticLocator} from './semantic_locator';
import {debug} from './util';

/**
 * Parse the input string (e.g. `{button 'OK'}`) to a SemanticLocator.
 * Validation is performed that (for example) all roles are correct, so all
 * parsed locators should be valid.
 */
export function parse(input: string): SemanticLocator {
  let parsed;
  try {
    parsed = pegParse(input);
  } catch (error: unknown) {
    if (error instanceof InvalidLocatorError) {
      throw error;
    }
    throw new InvalidLocatorError(
        `Failed to parse semantic locator "${input}". ` +
        `${(error as Error).message ?? error}`);
  }

  if (debug() && !(parsed instanceof SemanticLocator)) {
    throw new Error(
        `parse(${input}) didn't return a SemanticLocator.` +
        ` Return value ${JSON.stringify(parsed)}`);
  }
  const locator = parsed as SemanticLocator;

  if (locator.preOuter.length === 0 && locator.postOuter.length === 0) {
    throw new InvalidLocatorError('Locator is empty');
  }

  return locator;
}
