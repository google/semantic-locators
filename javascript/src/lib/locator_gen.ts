/**
 * @license
 * Copyright 2021 The Semantic Locators Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import {getNameFor} from './accessible_name';
import {findBySemanticLocator} from './find_by_semantic_locator';
import {isNonEmptyResult, NonEmptyResult} from './lookup_result';
import {getRole, isHidden} from './role';
import {isChildrenPresentational} from './role_map';
import {SemanticLocator, SemanticNode} from './semantic_locator';
import {assert} from './util';


/**
 * Builds the most precise locator which matches `element`. If `element` does
 * not have a role, return a semantic locator which matches the closest ancestor
 * with a role. "Precise" means that it matches the fewest other elements, while
 * being as short as possible.
 *
 * Returns null if no semantic locator exists for any ancestor.
 */
export function closestPreciseLocatorFor(
    element: HTMLElement, rootEl?: HTMLElement): string|null {
  const root = resolveRoot(element, rootEl);
  if (!root) {
    return null;
  }
  const full = closestFullLocator(element, root);
  if (full === null) {
    return null;
  }
  return refine(full.nodes, full.element, root).toString();
}

/**
 * Builds the most precise locator which matches `element`. "Precise" means that
 * it matches the fewest other elements, while being as short as possible.
 *
 * Returns null if no semantic locator exists.
 */
export function preciseLocatorFor(
    element: HTMLElement, rootEl?: HTMLElement): string|null {
  const root = resolveRoot(element, rootEl);
  if (!root) {
    return null;
  }
  const full = closestFullLocator(element, root);
  if (full === null || full.element !== element) {
    return null;
  }
  return refine(full.nodes, full.element, root).toString();
}

/**
 * Builds a semantic locator which matches `element`. If `element` does not have
 * a role, return a semantic locator which matches the closest ancestor with a
 * role.  "Simple" means it will only ever specify one node, even if more nodes
 * would be more precise. i.e. returns `{button 'OK'}`, never
 * `{listitem} {button 'OK'}`. To generate locators for tests,
 * `closestPreciseLocatorFor` or `preciseLocatorFor` are usually more suitable.
 *
 * Returns null if no semantic locator exists for any ancestor.
 */
export function closestSimpleLocatorFor(
    element: HTMLElement, rootEl?: HTMLElement): string|null {
  const root = resolveRoot(element, rootEl);
  if (!root) {
    return null;
  }
  return closestSemanticNode(element, root)?.node?.toString() ?? null;
}

/**
 * Builds a locator with only one part which matches `element`. "Simple" means
 * it will only ever specify one node, even if more nodes would be more precise.
 * i.e. returns `{button 'OK'}`, never `{listitem} {button 'OK'}`. To generate
 * locators for tests, `closestPreciseLocatorFor` or `preciseLocatorFor` are
 * usually more suitable.
 *
 * Returns null if no semantic locator exists.
 */
export function simpleLocatorFor(element: HTMLElement): string|null {
  return semanticNodeFor(element)?.toString() ?? null;
}

/**
 * Resolves the root element in which we are generating a locator. If no
 * explicit root is passed, the body of the document in which the element is
 * attached will be chosen.
 *
 * Returns null if the explicit `root` does not contain `element` or if the
 * `element` is not attached to any document.
 */
function resolveRoot(element: HTMLElement, root?: HTMLElement): HTMLElement|
    null {
  if (root && !root.contains(element)) {
    throw new Error(
        `Can't generate locator for element that is not contained within the root element.`);
  }

  if (!root) {
    const ownerDocument = element.ownerDocument;
    if (!ownerDocument) {
      throw new Error(`Can't generate locator for detached element`);
    }
    root = ownerDocument.body;
  }

  return root;
}

/**
 * Returns a list of one SemanticNode for each semantic ancestor of `element`,
 * and the closest semantic element to `element` (the element matched by the
 * semantic nodes).
 */
function closestFullLocator(element: HTMLElement, root: HTMLElement):
    {nodes: SemanticNode[]; element: HTMLElement}|null {
  let first = closestSemanticNode(element, root);
  if (first === null) {
    return null;
  }
  let nodes = [first.node];
  let target = first.element.parentElement;

  while (target !== null) {
    const nextTreeNode = closestSemanticNode(target, root);
    if (nextTreeNode !== null) {
      if (isChildrenPresentational(nextTreeNode.node.role)) {
        console.warn(
            `Element ${nextTreeNode.element} has a role of` +
            ` ${nextTreeNode.node.role}, so it has presentational children` +
            ` (https://www.w3.org/TR/wai-aria-practices/#children_presentational).` +
            ` However it also has descendant elements which would otherwise` +
            ` have semantics - matched by semantic locator` +
            ` ${new SemanticLocator(nodes, [])}. These presentational` +
            ` elements will be ignored while generating this semantic locator`);
        nodes = [];
        first = nextTreeNode;
      }
      nodes.unshift(nextTreeNode.node);
    }
    target = nextTreeNode?.element.parentElement ?? null;
  }
  assert(
      findByNodes(nodes, root).includes(first.element),
      `Cannot find element again with locator we just generated:\n` +
          `Nodes: ${nodes}\n` +
          `Element: ${first.element.outerHTML}\n`);
  return {nodes, element: first.element};
}

/**
 * Removes any `SemanticNodes` which don't affect which elements the nodes
 * match, and adds "outer" if it helps. Returns `null` if `nodes` is empty.
 *
 * Assumes that `element` is matched by `new SemanticLocator(nodes, [])`.
 */
export function refine(
    nodes: SemanticNode[], element: HTMLElement,
    root: HTMLElement): SemanticLocator {
  assert(nodes.length !== 0, 'Trying to refine empty array of nodes');
  const requiredNodes = removeRedundantNodes(nodes, root);
  assert(
      findByNodes(requiredNodes, root).includes(element),
      `Removing redundant nodes does not resolve element anymore:\n` +
          `Initial nodes: ${nodes}\n` +
          `After refinement: ${requiredNodes}\n`);
  return possiblyAddOuter(requiredNodes, element, root);
}

/**
 * Returns the closest ancestor (or `element` itself) with semantics along
 * with that element's SemanticNode. Doesn't include the `{document}` node from
 * `<body>`.
 */
function closestSemanticNode(el: HTMLElement, root: HTMLElement):
    {node: SemanticNode; element: HTMLElement}|null {
  let element: HTMLElement|null = el;
  // Exclude body elements as the `{document}` node would alwasys be stripped
  // out
  while (element !== null && root.contains(element) && root !== element) {
    const node = semanticNodeFor(element);
    if (node !== null) {
      return {node, element};
    }
    element = element.parentElement;
  }
  return null;
}

function semanticNodeFor(element: HTMLElement): SemanticNode|null {
  if (isHidden(element)) {
    return null;
  }
  const role = getRole(element);
  if (role === null) {
    return null;
  }
  return new SemanticNode(
      role,
      // TODO(alexlloyd) generate attributes - e.g. to refine a locator which
      // matches many similar elements
      [],
      getNameFor(element),
  );
}

/**
 * Adds "outer" to a locator if it would add any specificity (match less nodes)
 * while still matching the target node.
 */
function possiblyAddOuter(
    nodes: readonly SemanticNode[],
    trueTarget: HTMLElement,
    root: HTMLElement,
    ): SemanticLocator {
  // TODO: outer will never be added in the middle of a locator right now. For
  // that to happen removeRedundantNodes should see if it can add outer as it
  // goes and if the result is 'better' than the result without outer or with
  // outer at the start
  const withoutOuter = new SemanticLocator(nodes, []);
  const withoutOuterResult = assuredFindByLocator(withoutOuter, root);
  const withOuter = new SemanticLocator([], nodes);
  const outerResult = assuredFindByLocator(withOuter, root);

  if (outerResult.includes(trueTarget) &&
      outerResult.length < withoutOuterResult.length) {
    return withOuter;
  }
  return withoutOuter;
}

/**
 * This function wraps the `findBySemanticLocator` function, but asserts that
 * something is always found. This is useful as the generation code needs to
 * assume that the nodes it is generating selectors for can be found again with
 * said selectors.
 */
function assuredFindByLocator(
    locator: SemanticLocator, root: HTMLElement): readonly HTMLElement[] {
  const result = findBySemanticLocator(locator, root);
  assert(
      isNonEmptyResult(result), `Locator ${locator} didn't find any elements`);
  return (result as NonEmptyResult).found;
}


function findByNodes(
    nodes: readonly SemanticNode[], root: HTMLElement): readonly HTMLElement[] {
  const locator = new SemanticLocator(nodes, []);
  return assuredFindByLocator(locator, root);
}

/**
 * Removes nodes from `nodes` which don't effect which elements are found. The
 * last node is always important and won't be removed.
 *
 * This function prefers locators with semantic nodes closer to the target. e.g.
 * for `<ul><li><button id="foo">OK</button></li></ul>`, `{listitem} {button
 * 'OK'}` will be chosen over `{list} {button 'OK'}`. This is because:
 *   * Closer elements in the tree are more likely to change together so
 *     locators should be less brittle
 *   * The semantics of closer elements should contain more relevant info for
 *     about the target element so locators should be more human readable
 */
function removeRedundantNodes(
    nodes: readonly SemanticNode[],
    root: HTMLElement): readonly SemanticNode[] {
  if (nodes.length <= 1) {
    return nodes;
  }
  const targets = findByNodes(nodes, root);
  const requiredNodes: SemanticNode[] = [];
  // Try removing nodes one at a time (left to right), adding those which are
  // truly required to `requiredNodes`
  for (let i = 0; i < nodes.length - 1; i++) {
    const trial = requiredNodes.concat(nodes.slice(i + 1));
    if (findByNodes(trial, root).length > targets.length) {
      requiredNodes.push(nodes[i]);
    }
  }
  requiredNodes.push(nodes[nodes.length - 1]);
  return requiredNodes;
}
