/**
 * @license
 * Copyright 2021 The Semantic Locators Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import {getNameFor, nameMatches} from './accessible_name';
import {computeARIAAttributeValue} from './attribute';
import {cachedDuringBatch, inBatchOp, runBatchOp} from './batch_cache';
import {NoSuchElementError} from './error';
import {buildFailureMessage, combineMostSpecific, EmptyResultsMetadata, isEmptyResultsMetadata, isNonEmptyResult, Result} from './lookup_result';
import {outerNodesOnly} from './outer';
import {parse} from './parse_locator';
import {findByRole} from './role';
import {SemanticLocator, SemanticNode} from './semantic_locator';
import {assertInDocumentOrder, compareNodeOrder, removeDuplicates} from './util';

/**
 * Find all elements in the DOM by the given semantic locator and returns them
 * in the correct order.
 */
export function findElementsBySemanticLocator(
    locator: string,
    root: HTMLElement = document.body,
    ): HTMLElement[] {
  const result = findBySemanticLocator(parse(locator), root);
  if (isEmptyResultsMetadata(result)) {
    return [];
  }
  return result.found as HTMLElement[];
}

/**
 * Find the first element in the DOM by the given semantic locator. Throws
 * NoSuchElementError if no matching elements are found.
 */
export function findElementBySemanticLocator(
    locator: string,
    root: HTMLElement = document.body,
    ): HTMLElement {
  const parsed = parse(locator);
  const result = findBySemanticLocator(parsed, root);
  if (isEmptyResultsMetadata(result)) {
    throw new NoSuchElementError(getFailureMessage(parsed, root, result));
  }
  return result.found[0];
}

/**
 * Build a string explaining the failure in `result`.
 *
 * This function performs locator resolution while investigating the failure.
 */
export function getFailureMessage(
    locator: SemanticLocator, root: HTMLElement, result: EmptyResultsMetadata) {
  const hiddenResult = findBySemanticLocator(locator, root, true);
  const hiddenMatches =
      isEmptyResultsMetadata(hiddenResult) ? [] : hiddenResult.found;
  const presentationalResult =
      findBySemanticLocator(locator, root, false, true);
  const presentationalMatches = isEmptyResultsMetadata(presentationalResult) ?
      [] :
      presentationalResult.found;
  return buildFailureMessage(
      locator, result, hiddenMatches, presentationalMatches);
}

/**
 * @return a list of elements in the document which are matched by the locator.
 *     Returns elements in document order.
 */
export function findBySemanticLocator(
    locator: SemanticLocator,
    root: HTMLElement = document.body,
    includeHidden: boolean = false,
    includePresentational: boolean = false,
    ): Result {
  let result: Result|null = null;
  if (inBatchOp()) {
    result = findBySemanticLocatorCached(
        locator, root, includeHidden, includePresentational);
  } else {
    runBatchOp(() => {
      result = findBySemanticLocatorCached(
          locator, root, includeHidden, includePresentational);
    });
  }
  return result!;
}

const findBySemanticLocatorCached =
    cachedDuringBatch(findBySemanticLocatorInternal);

function findBySemanticLocatorInternal(
    locator: SemanticLocator,
    root: HTMLElement,
    includeHidden: boolean,
    includePresentational: boolean,
    ): Result {
  const searchBase = findBySemanticNodes(
      locator.preOuter, [root], includeHidden, includePresentational);
  if (isEmptyResultsMetadata(searchBase)) {
    return searchBase;
  }
  if (locator.postOuter.length === 0) {
    return searchBase;
  }
  const results =
      searchBase
          .found
          // 'outer' semantics are relative to the search base so we must do a
          // separate call to findBySemanticNodes for each base, then filter the
          // results for each base individually
          // TODO(alexlloyd) this could be optimised with a k-way merge removing
          // duplicates rather than concat + sort in separate steps.
          .map(
              base => findBySemanticNodes(
                  locator.postOuter, [base], includeHidden,
                  includePresentational));
  const elementsFound = results.filter(isNonEmptyResult)
                            .flatMap(result => outerNodesOnly(result.found));

  if (elementsFound.length === 0) {
    const noneFound = combineMostSpecific(results as EmptyResultsMetadata[]);
    return {
      closestFind: locator.preOuter.concat(noneFound.closestFind),
      elementsFound: noneFound.elementsFound,
      notFound: noneFound.notFound,
      partialFind: noneFound.partialFind,
    };
  }

  // If node.outer then there's no guarantee that elements are
  // unique or in document order.
  //
  // e.g. locator "{list} outer {listitem}" and DOM:
  //
  // <ul id="a">
  //   <ul id="b">
  //     <li id="c"></li>
  //   </ul>
  //   <li id="d"></li>
  // </ul>
  //
  // searchBase = [a, b] so found = [c, d, c]
  // So sort by document order to maintain the invariant
  return {found: removeDuplicates(elementsFound.sort(compareNodeOrder))};
}

function findBySemanticNodes(
    nodes: readonly SemanticNode[],
    searchBase: readonly HTMLElement[],
    includeHidden: boolean,
    includePresentational: boolean,
    ): Result {
  for (let i = 0; i < nodes.length; i++) {
    const result = findBySemanticNode(
        nodes[i], searchBase, includeHidden, includePresentational);
    if (isEmptyResultsMetadata(result)) {
      return {
        closestFind: nodes.slice(0, i),
        elementsFound: result.elementsFound,
        notFound: result.notFound,
        partialFind: result.partialFind
      };
    }
    searchBase = result.found;
  }
  return {found: searchBase};
}

/**
 * @param `searchBase` elements to search below. These elements must be in
 *     document order.
 * @return a list of elements under `searchBase` in document order.
 */
function findBySemanticNode(
    node: SemanticNode,
    searchBase: readonly HTMLElement[],
    includeHidden: boolean,
    includePresentational: boolean,
    ): Result {
  // Filter out non-outer elements as an optimisation. Suppose A and B are in
  // searchBase, and A contains B. Then all nodes below B are also below A so
  // there's no point searching below B.
  //
  // Filtering here has the added benefit of making it easy to return elements
  // in document order.
  searchBase = outerNodesOnly(searchBase);

  let elements = searchBase.flatMap(
      base =>
          findByRole(node.role, base, includeHidden, includePresentational));
  if (elements.length === 0) {
    return {
      closestFind: [],
      elementsFound: searchBase,
      notFound: {role: node.role},
    };
  }

  const attributes = node.attributes;
  for (let i = 0; i < attributes.length; i++) {
    const nextElements = elements.filter(
        element => computeARIAAttributeValue(element, attributes[i].name) ===
            attributes[i].value);

    if (nextElements.length === 0) {
      return {
        closestFind: [],
        elementsFound: elements,
        notFound: {attribute: attributes[i]},
        partialFind: {role: node.role, attributes: attributes.slice(0, i)},
      };
    }
    elements = nextElements;
  }

  if (node.name) {
    const nextElements = elements.filter(
        element => nameMatches(node.name!, getNameFor(element)));
    if (nextElements.length === 0) {
      return {
        closestFind: [],
        elementsFound: elements,
        notFound: {name: node.name},
        partialFind: {role: node.role, attributes: node.attributes},
      };
    }
    elements = nextElements;
  }
  assertInDocumentOrder(elements);
  return {found: elements};
}
