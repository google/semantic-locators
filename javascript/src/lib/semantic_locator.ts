/**
 * @license
 * Copyright 2021 The Semantic Locators Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import {CacheableObject} from './batch_cache';
import {InvalidLocatorError} from './error';
import {AriaRole, isAriaRole, isChildrenPresentational} from './role_map';
import {QuoteChar, SUPPORTED_ATTRIBUTES, SupportedAttributeType} from './types';

/** An attribute-value pair. */
export interface Attribute {
  name: SupportedAttributeType;
  value: string;
}

/** A parsed semantic locator. */
export class SemanticLocator implements CacheableObject {
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

  toString(quoteChar?: QuoteChar): string {
    const resultBuilder: string[] = [];
    for (const node of this.preOuter) {
      resultBuilder.push(node.toString(quoteChar));
    }

    if (this.postOuter.length > 0) {
      resultBuilder.push('outer');
      for (const node of this.postOuter) {
        resultBuilder.push(node.toString(quoteChar));
      }
    }

    return resultBuilder.join(' ');
  }

  hashCode() {
    return this.toString();
  }
}

/** A single node of a semantic locator (e.g. {button 'OK'}). */
export class SemanticNode {
  constructor(
      readonly role: AriaRole,
      readonly attributes: readonly Attribute[],
      readonly name?: string,
  ) {}

  toString(quoteChar?: QuoteChar): string {
    let result: string = '';
    result += '{';
    result += this.role;
    if (this.name) {
      result += ' ';
      result += escapeAndSurroundWithQuotes(this.name, quoteChar);
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
function escapeAndSurroundWithQuotes(
    raw: string, quoteChar?: QuoteChar): string {
  if (quoteChar === undefined) {
    if (raw.includes('\'') && !raw.includes('"')) {
      quoteChar = '"';
    } else {
      quoteChar = `'`;
    }
  }

  const escaped = raw.replace(new RegExp(quoteChar, 'g'), `\\${quoteChar}`);
  return `${quoteChar}${escaped}${quoteChar}`;
}
