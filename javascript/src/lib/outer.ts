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
