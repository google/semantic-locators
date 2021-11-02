/**
 * @license
 * Copyright 2021 The Semantic Locators Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import {SemanticLocatorError} from 'google3/third_party/semantic_locators/javascript/lib/error';
import {QuoteChar} from 'google3/third_party/semantic_locators/javascript/lib/types';
import {findElementBySemanticLocator, findElementsBySemanticLocator} from 'semantic-locators';
import {closestPreciseLocatorFor, closestSimpleLocatorFor, preciseLocatorFor, simpleLocatorFor} from 'semantic-locators/gen';

/**
 * Error class is lost when returning from WebDriver.executeScript, so include
 * the class name in the error message.
 */
function wrapError(func: Function): Function {
  return (...args: unknown[]) => {
    try {
      return func(...args);
    } catch (error: unknown) {
      if (error instanceof SemanticLocatorError) {
        error = new Error(error.extendedMessage());
      }
      throw error;
    }
  };
}

function exportGlobal(name: string, value: unknown) {
  if (typeof value === 'function') {
    value = wrapError(value);
  }
  // tslint:disable-next-line:no-any Set global.
  (window as any)[name] = value;
}

exportGlobal('findElementsBySemanticLocator', findElementsBySemanticLocator);
exportGlobal('findElementBySemanticLocator', findElementBySemanticLocator);
exportGlobal(
    'closestPreciseLocatorFor',
    (element: HTMLElement, rootEl?: HTMLElement, quoteChar?: QuoteChar) =>
        closestPreciseLocatorFor(element, {rootEl, quoteChar}));
exportGlobal(
    'preciseLocatorFor',
    (element: HTMLElement, rootEl?: HTMLElement, quoteChar?: QuoteChar) =>
        preciseLocatorFor(element, {rootEl, quoteChar}));
exportGlobal(
    'closestSimpleLocatorFor',
    (element: HTMLElement, rootEl?: HTMLElement, quoteChar?: QuoteChar) =>
        closestSimpleLocatorFor(element, {rootEl, quoteChar}));
exportGlobal('simpleLocatorFor', simpleLocatorFor);

// Marker for clients to check that semantic locators have been loaded
exportGlobal('semanticLocatorsReady', true);
