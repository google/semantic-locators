/**
 * @license
 * Copyright 2021 The Semantic Locators Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from './util';

const caches: Array<Map<unknown, unknown>> = [];
let isBatchOp = false;

/** Whether we're currently in a batch operation. */
export function inBatchOp() {
  return isBatchOp;
}

/**
 * Run a function during which all relevant functions get their results cached
 */
export function runBatchOp(fn: () => void): void {
  assert(!inBatchOp(), 'Already in a batch operation');
  isBatchOp = true;
  try {
    fn();
  } finally {
    assert(inBatchOp(), 'Not in a batch operation');
    isBatchOp = false;
    for (const cache of caches) {
      cache.clear();
    }
  }
}

/**
 * Return a version of a function whose results get cached during batch
 * operations
 */
export function cachedDuringBatch<Args extends CacheableArg[], Ret>(
    fn: (...args: Args) => Ret): (...args: Args) => Ret {
  const cache = new Map<unknown, unknown>();
  caches.push(cache);

  return (...args: Args) => {
    if (!isBatchOp) {
      return fn(...args);
    }

    // Find the local cache
    let localCache = cache;
    for (const arg of args) {
      const key = isCacheableObject(arg) ? arg.hashCode() : arg;
      localCache =
          getOrElse(localCache, key, () => new Map()) as Map<unknown, unknown>;
    }

    // Use `undefined` as the last key to simplify implementation & support 0
    // arguments
    return getOrElse(localCache, undefined, () => fn(...args)) as Ret;
  };
}

/** A valid key for the map used as a cache. */
export interface CacheableObject {
  hashCode(): string;
}

function isCacheableObject(o: CacheableArg): o is CacheableObject {
  return (o as CacheableObject).hashCode !== undefined;
}

type CacheableArg = HTMLElement|string|number|boolean|CacheableObject;

function getOrElse<K, V>(map: Map<K, V>, key: K, valueFn: () => V): V {
  let value = map.get(key);
  if (value === undefined) {
    value = valueFn();
    map.set(key, value);
  }
  return value;
}
