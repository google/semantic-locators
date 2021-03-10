/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
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
