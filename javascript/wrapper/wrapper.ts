/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {isSemanticLocatorError} from 'google3/third_party/semantic_locators/javascript/lib/error';
import {findElementBySemanticLocator, findElementsBySemanticLocator} from 'semantic-locators';
import {closestPreciseLocatorFor} from 'semantic-locators/gen';

/**
 * Error class is lost when returning from WebDriver.executeScript, so include
 * the class name in the error message.
 */
function wrapError<T extends unknown[], U>(func: Func<T, U>): Func<T, U> {
  return (...args: T) => {
    try {
      return func(...args);
    } catch (error) {
      if (isSemanticLocatorError(error)) {
        error = new Error(error.extendedMessage());
      }
      throw error;
    }
  };
}

type Func<T extends unknown[], U> = (...args: T) => U;

// tslint:disable-next-line:no-any Set global.
(window as any)['findElementsBySemanticLocator'] =
    wrapError(findElementsBySemanticLocator);
// tslint:disable-next-line:no-any Set global.
(window as any)['findElementBySemanticLocator'] =
    wrapError(findElementBySemanticLocator);
// tslint:disable-next-line:no-any Set global.
(window as any)['closestPreciseLocatorFor'] =
    wrapError(closestPreciseLocatorFor);

// Marker for clients to check that semantic locators have been loaded
// tslint:disable-next-line:no-any Set global.
(window as any)['semanticLocatorsReady'] = true;
