/**
 * @license
 * Copyright 2021 The Semantic Locators Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import {assertInDocumentOrder} from './util';

/**
 * Return an Array containing only the outer nodes from the input array. i.e.
 * remove nodes which are contained by other nodes in the list. Also remove
 * duplicate elements as a.contains(a) === true
 *
 * Throws a ValueError if nodes are not in document order.
 */
export function outerNodesOnly<T extends Node>(nodes: readonly T[]):
    readonly T[] {
  assertInDocumentOrder(nodes);

  if (nodes.length === 0) {
    return [];
  }
  const filtered = [nodes[0]];
  for (const node of nodes) {
    // The last element of filtered is the current outer node
    if (!filtered[filtered.length - 1].contains(node)) {
      filtered.push(node);
    }
  }
  return filtered;
}
