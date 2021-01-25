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
import {AriaRole} from './role_map';
import {isAriaRole} from './role_map';
import {SupportedAttributeType} from './types';
import {SUPPORTED_ATTRIBUTES} from './types';

/** An attribute-value pair. */
export interface Attribute {
  name: SupportedAttributeType;
  value: string;
}

/** A parsed semantic locator. */
export class SemanticLocator {
  constructor(
      readonly preOuter: readonly SemanticNode[],
      readonly postOuter: readonly SemanticNode[]) {
    const allNodes = preOuter.concat(postOuter);
    for (const node of allNodes) {
      // The TypeScript compiler should check this at compile time, but parsing
      // user-provided locators is not type-safe
      if (!isAriaRole(node.role)) {
        throw new InvalidLocatorError(
            `Invalid locator: ${this}` +
            ` Unknown role: ${node.role}.` +
            ` The list of valid roles can be found at` +
            ` https://www.w3.org/TR/wai-aria/#role_definitions`);
      }

      // The TypeScript compiler should check this at compile time, but parsing
      // user-provided locators is not type-safe
      for (const attribute of node.attributes) {
        if (!SUPPORTED_ATTRIBUTES.includes(attribute.name)) {
          throw new InvalidLocatorError(
              `Invalid locator: ${this}` +
              ` Unsupported attribute: ${attribute.name}.` +
              ` Supported attributes: ${SUPPORTED_ATTRIBUTES}`);
        }
        // TODO(alexlloyd) validate the type of attributes (e.g. true/false)
      }
    }
  }

  toString(): string {
    const resultBuilder: string[] = [];
    for (const node of this.preOuter) {
      resultBuilder.push(node.toString());
    }

    if (this.postOuter.length > 0) {
      resultBuilder.push('outer');
      for (const node of this.postOuter) {
        resultBuilder.push(node.toString());
      }
    }

    return resultBuilder.join(' ');
  }
}

/** A single node of a semantic locator (e.g. {button 'OK'}). */
export class SemanticNode {
  constructor(
      readonly role: AriaRole,
      readonly attributes: readonly Attribute[],
      readonly name?: string,
  ) {}

  toString(): string {
    let result: string = '';
    result += '{';
    result += this.role;
    if (this.name) {
      result += ' ';
      result += escapeAndSurroundWithQuotes(this.name);
    }

    for (const attribute of this.attributes) {
      result += ` ${attribute.name}:${attribute.value}`;
    }
    result += '}';

    return result;
  }
}

/**
 * Surrounds the raw string with quotes, escaping any quote characters in the
 * string. If the raw string contains one type of quote character then it will
 * be surrounded by the other.
 *
 * e.g. `You're up` -> `"You're up"`
 *
 * `"Quote" - Author` -> `'"Quote" - Author'`.
 */
function escapeAndSurroundWithQuotes(raw: string): string {
  if (raw.includes('\'') && !raw.includes('"')) {
    return JSON.stringify(raw);
  }
  return `'${raw.replace(/'/g, '\\\'')}'`;
}
