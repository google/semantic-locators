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
