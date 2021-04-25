/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {InvalidLocatorError} from './error';
import {AriaRole, isAriaRole, isChildrenPresentational} from './role_map';
import {SUPPORTED_ATTRIBUTES, SupportedAttributeType} from './types';
import {entries} from './util';

/** Mapping from attributes to values */
export type AttributeMap = Partial<Record<SupportedAttributeType, string>>;

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

      if (node !== allNodes[allNodes.length - 1] &&
          isChildrenPresentational(node.role)) {
        throw new InvalidLocatorError(
            `Invalid locator: ${this}` +
            ` The role "${node.role}" has presentational children.` +
            ` That means its descendants cannot have semantics, so an element` +
            ` with a role of ${node.role} may only` +
            ` be the final element of a Semantic Locator.` +
            ` https://www.w3.org/TR/wai-aria-practices/#children_presentational`);
      }

      // The TypeScript compiler should check this at compile time, but parsing
      // user-provided locators is not type-safe
      for (const attribute of entries(node.attributes)) {
        if (!SUPPORTED_ATTRIBUTES.includes(attribute[0])) {
          throw new InvalidLocatorError(
              `Invalid locator: ${this}` +
              ` Unsupported attribute: ${attribute[0]}.` +
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
      readonly name?: string,
      readonly attributes: AttributeMap = {},
  ) {}
  toString(): string {
    let result: string = '';
    result += '{';
    result += this.role;
    if (this.name) {
      result += ' ';
      result += escapeAndSurroundWithQuotes(this.name);
    }

    for (const [name, value] of entries(this.attributes)) {
      result += ` ${name}:${value}`;
    }

    result += '}';
    return result;
  }

  copyWith(modified: Partial<SemanticNode>) {
    return new SemanticNode(
        modified.role ?? this.role,
        modified.name ?? this.name,
        {...this.attributes, ...(modified.attributes ?? {})},
    );
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
