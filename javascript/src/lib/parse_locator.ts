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

import {InvalidLocatorError} from './error';
import {parse as pegParse} from './parser';
import {isAriaRole} from './role_map';
import {SemanticLocator} from './semantic_locator';
import {SUPPORTED_ATTRIBUTES} from './types';
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
  } catch (error) {
    throw new InvalidLocatorError(
        `Failed to parse semantic locator "${input}". Error message: ` +
        `${error.message}`);
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
  const allNodes = locator.preOuter.concat(locator.postOuter);
  for (const node of allNodes) {
    if (!isAriaRole(node.role)) {
      throw new InvalidLocatorError(
          `Unknown role: ${node.role}.` +
          ` The list of valid roles can be found at` +
          ` https://www.w3.org/TR/wai-aria/#role_definitions`);
    }
    for (const attribute of node.attributes) {
      if (!SUPPORTED_ATTRIBUTES.includes(attribute.name)) {
        throw new InvalidLocatorError(
            `Unsupported attribute: ${attribute.name}.` +
            ` Supported attributes: ${SUPPORTED_ATTRIBUTES}`);
      }
      // TODO(alexlloyd) validate the type of attributes also (e.g. true/false)
    }
  }

  return locator;
}
