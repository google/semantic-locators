/**
 * @license
 * Copyright 2021 The Semantic Locators Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import {getNameFor} from './accessible_name';
import {runBatchOp} from './batch_cache';
import {findBySemanticLocator, getFailureMessage} from './find_by_semantic_locator';
import {EmptyResultsMetadata, isNonEmptyResult, NonEmptyResult} from './lookup_result';
import {closestChildrenPresentationalAncestor, getRole, isHidden} from './role';
import {SemanticLocator, SemanticNode} from './semantic_locator';
import {QuoteChar} from './types';
import {assert, lazyAssert} from './util';

declare interface GenerationParams {
  rootEl?: HTMLElement;
  quoteChar?: QuoteChar;
}

declare type BatchGenerationParams =
    GenerationParams & {timeoutSeconds?: number};

/**
 * Builds the most precise locator which matches `element`. If `element` does
 * not have a role, return a semantic locator which matches the closest ancestor
 * with a role. "Precise" means that it matches the fewest other elements, while
 * being as short as possible.
 *
 * Returns null if no semantic locator exists for any ancestor.
 */
export function closestPreciseLocatorFor(
    element: HTMLElement, generationParams: GenerationParams = {}): string|
    null {
  const {rootEl, quoteChar} = generationParams;
  const root = resolveRoot(element, rootEl);
  if (!root) {
    return null;
  }
  const full = closestLocator(element, root);
  if (full === null) {
    return null;
  }
  return refine(full.nodes, full.element, root, /* firstNodeRequired= */ true)
      .toString(quoteChar);
}

/**
 * Batch version of `closestPreciseLocatorFor`.
 *
 * If `timeoutSeconds` is exceeded the returned map will only contain locators
 * for elements computed until that point.
 */
export const batchClosestPreciseLocatorFor = batch(closestPreciseLocatorFor);

/**
 * Builds the most precise locator which matches `element`. "Precise" means that
 * it matches the fewest other elements, while being as short as possible.
 *
 * Returns null if no semantic locator exists.
 */
export function preciseLocatorFor(
    element: HTMLElement, generationParams: GenerationParams = {}): string|
    null {
  const {rootEl, quoteChar} = generationParams;
  const root = resolveRoot(element, rootEl);
  if (!root) {
    return null;
  }
  const full = closestLocator(element, root);
  if (full === null || full.element !== element) {
    return null;
  }
  return refine(full.nodes, full.element, root, /* firstNodeRequired= */ true)
      .toString(quoteChar);
}

/**
 * Batch version of `preciseLocatorFor`.
 *
 * If `timeoutSeconds` is exceeded the returned map will only contain locators
 * for elements computed until that point.
 */
export const batchPreciseLocatorFor = batch(preciseLocatorFor);

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
    element: HTMLElement, generationParams: GenerationParams = {}): string|
    null {
  const {rootEl, quoteChar} = generationParams;
  const root = resolveRoot(element, rootEl);
  if (!root) {
    return null;
  }
  return closestSemanticNode(element, root)?.node?.toString(quoteChar) ?? null;
}

/**
 * Batch version of `closestSimpleLocatorFor`.
 *
 * If `timeoutSeconds` is exceeded the returned map will only contain locators
 * for elements computed until that point.
 */
export const batchClosestSimpleLocatorFor = batch(closestSimpleLocatorFor);

/**
 * Builds a locator with only one part which matches `element`. "Simple" means
 * it will only ever specify one node, even if more nodes would be more precise.
 * i.e. returns `{button 'OK'}`, never `{listitem} {button 'OK'}`. To generate
 * locators for tests, `closestPreciseLocatorFor` or `preciseLocatorFor` are
 * usually more suitable.
 *
 * Returns null if no semantic locator exists.
 */
export function simpleLocatorFor(
    element: HTMLElement, quoteChar?: QuoteChar): string|null {
  return semanticNodeFor(element)?.toString(quoteChar) ?? null;
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
 * Returns a list of one SemanticNode for each semantic ancestor of `element`
 * (as long as it adds precision to the locator), and the closest semantic
 * element to `element` (the element matched by the semantic nodes).
 */
function closestLocator(element: HTMLElement, root: HTMLElement):
    {nodes: SemanticNode[]; element: HTMLElement}|null {
  const presentationalAncestor = closestChildrenPresentationalAncestor(element);
  if (presentationalAncestor !== null) {
    console.info(
        `Element ${presentationalAncestor} has a role of` +
        ` ${getRole(presentationalAncestor)}, so it has presentational` +
        ` children (https://www.w3.org/TR/wai-aria-practices/#children_presentational).` +
        ` These presentational elements will be ignored while generating this semantic locator`);
    return closestLocator(presentationalAncestor, root);
  }

  const first = closestSemanticNode(element, root);
  if (first === null) {
    return null;
  }
  const nodes = [first.node];
  let targetEl = first.element.parentElement;
  let foundByPreviousNodes = findByNodes(nodes, root);

  while (targetEl !== null &&
         // If every found node contains the target then adding more nodes will
         // not add precision
         !foundByPreviousNodes.every(el => targetEl!.contains(el))) {
    const nextTreeNode = closestSemanticNode(targetEl, root);
    if (nextTreeNode !== null) {
      const trial = [...nodes];
      trial.unshift(nextTreeNode.node);
      const foundByNodes = findByNodes(trial, root);
      if (foundByNodes.length < foundByPreviousNodes.length) {
        nodes.unshift(nextTreeNode.node);
      }
      foundByPreviousNodes = foundByNodes;
    }
    targetEl = nextTreeNode?.element.parentElement ?? null;
  }
  assert(
      foundByPreviousNodes.includes(first.element),
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
    nodes: SemanticNode[], element: HTMLElement, root: HTMLElement,
    firstNodeRequired: boolean) {
  assert(nodes.length !== 0, 'Trying to refine empty array of nodes');
  const requiredNodes = removeRedundantNodes(nodes, root, firstNodeRequired);
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
 * This function wraps the `findBySemanticLocator` function, but asserts
 * that something is always found. This is useful as the generation code needs
 * to assume that the nodes it is generating selectors for can be found again
 * with said selectors.
 */
function assuredFindByLocator(
    locator: SemanticLocator, root: HTMLElement): readonly HTMLElement[] {
  const result = findBySemanticLocator(locator, root);
  lazyAssert(
      isNonEmptyResult(result),
      () => `assuredFindByLocator found no elements: ${
          getFailureMessage(locator, root, result as EmptyResultsMetadata)};`);
  return (result as NonEmptyResult).found;
}


function findByNodes(
    nodes: readonly SemanticNode[], root: HTMLElement): readonly HTMLElement[] {
  const locator = new SemanticLocator(nodes, []);
  return assuredFindByLocator(locator, root);
}

/**
 * Removes nodes from `nodes` which don't effect which elements are found. The
 * last node is always necessary and the first node is necessary if
 * `firstNodeRequired === true`.
 *
 * This function prefers locators with semantic nodes closer to the targetEl.
 * e.g. for `<ul><li><button id="foo">OK</button></li></ul>`,
 * `{listitem} {button 'OK'}` will be chosen over `{list} {button 'OK'}`. This
 * is because:
 *   * Closer elements in the tree are more likely to change together so
 *     locators should be less brittle
 *   * The semantics of closer elements should contain more relevant info for
 *     about the targetEl element so locators should be more human readable
 */
function removeRedundantNodes(
    nodes: readonly SemanticNode[], root: HTMLElement,
    firstNodeRequired: boolean): readonly SemanticNode[] {
  const leadingRequiredNodeCount = firstNodeRequired ? 1 : 0;
  if (nodes.length <= leadingRequiredNodeCount + 1) {
    return nodes;
  }
  const targets = findByNodes(nodes, root);
  const requiredNodes: SemanticNode[] =
      nodes.slice(0, leadingRequiredNodeCount);
  // Try removing nodes one at a time (left to right), adding those which are
  // truly required to `requiredNodes`.
  for (let i = leadingRequiredNodeCount; i < nodes.length - 1; i++) {
    const trial = requiredNodes.concat(nodes.slice(i + 1));
    if (findByNodes(trial, root).length > targets.length) {
      requiredNodes.push(nodes[i]);
    }
  }
  requiredNodes.push(nodes[nodes.length - 1]);
  return requiredNodes;
}

type LocatorGenFunction =
    (element: HTMLElement, generationParams: GenerationParams) => string|null;

type BatchLocatorGenFunction =
    (elements: Set<HTMLElement>, generationParams: BatchGenerationParams) =>
        WeakMap<HTMLElement, string|null>;

function batch(individualFunction: LocatorGenFunction):
    BatchLocatorGenFunction {
  return (elements: Set<HTMLElement>,
          generationParams: BatchGenerationParams = {}) => {
    const {rootEl, quoteChar, timeoutSeconds} = generationParams;
    let timeoutMillis: number|null = null;
    if (timeoutSeconds) {
      timeoutMillis = Date.now() + timeoutSeconds * 1000;
    }
    const results = new WeakMap<HTMLElement, string|null>();
    runBatchOp(() => {
      let done = 0;
      for (const element of elements) {
        if (timeoutMillis !== null && Date.now() > timeoutMillis) {
          console.info(`Timed out computing batch locators after ${
              timeoutSeconds}s. Computed ${done}/${
              elements.size} locators before timing out.`);
          return;
        }
        results.set(element, individualFunction(element, {rootEl, quoteChar}));
        done += 1;
      }
    });
    return results;
  };
}

export const TEST_ONLY = {batch};
