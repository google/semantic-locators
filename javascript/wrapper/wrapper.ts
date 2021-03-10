/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {SemanticLocatorError} from 'google3/third_party/semantic_locators/javascript/lib/error';
import {findElementBySemanticLocator, findElementsBySemanticLocator} from 'semantic-locators';
import {closestPreciseLocatorFor, preciseLocatorFor} from 'semantic-locators/gen';

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
exportGlobal('closestPreciseLocatorFor', closestPreciseLocatorFor);
exportGlobal('preciseLocatorFor', preciseLocatorFor);

// Marker for clients to check that semantic locators have been loaded
exportGlobal('semanticLocatorsReady', true);
