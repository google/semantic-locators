/**
 * @license
 * Copyright 2021 The Semantic Locators Authors
 * SPDX-License-Identifier: Apache-2.0
 */

/** Flip to `true` to enable assertions and extra validation checks. */
const DEBUG_MODE = false;

/**
 * For use at the end of a switch/series of checks. This function fails to
 * compile or run if it may ever be called with a real value.
 */
export function checkExhaustive(value: never): never {
  throw new Error(`unexpected value ${value}!`);
}

/**
 * In debug builds, throw an error if elements are not in document order. In
 * non-debug builds this function is a no-op.
 */
export function assertInDocumentOrder(elements: readonly Node[]) {
  if (debug()) {
    // Assert document order
    for (let i = 1; i < elements.length; i++) {
      if (compareNodeOrder(elements[i - 1], elements[i]) > 0) {
        throw new Error(
            `Elements not passed in document order. Index ${(i - 1)} comes ` +
            `after index ${i}. Elements: ${JSON.stringify(elements)}`);
      }
    }
  }
}

/**
 * Compares the document order of two nodes, returning 0 if they are the same
 * node, a negative number if node1 is before node2, and a positive number if
 * node2 is before node1.  Note that we compare the order the tags appear in the
 * document so in the tree <b><i>text</i></b> the B node is considered to be
 * before the I node.
 *
 * Based on Closure goog.dom.compareNodeOrder, translated to TypeScript, with
 * closure dependencies removed and with less support for older browsers
 */
export function compareNodeOrder(node1: Node, node2: Node): number {
  // Fall out quickly for equality.
  if (node1 === node2) {
    return 0;
  }

  const node2PreceedsNode1 =
      node1.compareDocumentPosition(node2) & Node.DOCUMENT_POSITION_PRECEDING;
  return node2PreceedsNode1 ? 1 : -1;
}

/** Remove duplicates from a sorted array. */
export function removeDuplicates<T>(arr: T[]): T[] {
  return arr.filter((el, i) => arr[i - 1] !== el);
}

/**
 * Checks whether the `tagName` of a particular element matches a known
 * tagName. The `tagName` is constrained by the same type mappings that are used
 * in `document.querySelector`, which allows us to constrain the return type as
 * well.
 */
export function hasTagName<TagName extends keyof HTMLElementTagNameMap>(
    el: HTMLElement, name: TagName): el is HTMLElementTagNameMap[TagName];
export function hasTagName<TagName extends keyof SVGElementTagNameMap>(
    el: SVGElement, name: TagName): el is SVGElementTagNameMap[TagName];
export function hasTagName(el: Element, name: string): boolean {
  return el.tagName.toLowerCase() === name;
}

/** Type guard for Node */
export function isNode(e: EventTarget): e is Node {
  return (e as Node).nodeName !== null;
}

/** Type guard for Element */
function isElement(node: Node): node is Element {
  return node.nodeType === Node.ELEMENT_NODE;
}

const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';

/** Check whether `node` is a HTMLElement. */
export function isHTMLElement(node: Node): node is HTMLElement {
  return isElement(node) && node.namespaceURI === HTML_NAMESPACE;
}

/** Throw an exception if the condition is false. */
export function assert(condition: boolean, givenMessage?: string): boolean {
  if (debug() && !condition) {
    let message = 'Assertion failed';
    if (givenMessage !== undefined) {
      message += ': ' + givenMessage;
    }
    throw new Error(message);
  }
  return condition;
}

/**
 * Throw an exception if the condition is false, evaluating `messageSupplier`
 * as the error message
 */
export function lazyAssert(
    condition: boolean, messageSupplier: () => string): boolean {
  if (debug() && !condition) {
    throw new Error(`Assertion failed: ${messageSupplier()}`);
  }
  return condition;
}

/** Are we in debug mode? */
export function debug(): boolean {
  return (window as unknown as {goog?: {DEBUG?: boolean}})?.goog?.DEBUG ||
      DEBUG_MODE;
}
