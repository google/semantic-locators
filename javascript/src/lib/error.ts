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

/**
 * Base class for all semantic locator errors. Errors thrown by semantic
 * locators will extend this error.
 */
export class SemanticLocatorError extends Error {
  errorName = 'SemanticLocatorError';
  extendedMessage(): string {
    return `${this.errorName}: ${this.message}`;
  }
}

/** Type guard for SemanticLocatorError. */
export function isSemanticLocatorError(error: Error):
    error is SemanticLocatorError {
  return (error as SemanticLocatorError).extendedMessage !== undefined;
}

/** No element found for the given locator. */
export class NoSuchElementError extends SemanticLocatorError {
  errorName = 'NoSuchElementError';
}

/** Invalid value passed to a function. */
export class ValueError extends SemanticLocatorError {
  errorName = 'ValueError';
}

/** A locator is invalid. */
export class InvalidLocatorError extends SemanticLocatorError {
  errorName = 'InvalidLocatorError';
}
