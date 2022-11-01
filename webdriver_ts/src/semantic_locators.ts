/**
 * @license
 * Copyright 2021 The Semantic Locators Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import {promise as webDriverPromise, WebDriver, WebElement} from 'selenium-webdriver';  // from //third_party/javascript/typings/selenium_webdriver:selenium_webdriver_3_0_0

import {wrapperBin} from '../data/wrapper_bin';  // from //third_party/semantic_locators/webdriver_ts/data

/**
 * A helper method which can be passed into the `findElement` or `findElements`
 * methods of either a `WebDriver` or a `WebElement` instance.
 *
 * Example:
 *     const list = driver.findElement(bySemanticLocator(`{list 'Tasks'}`))
 *     const listItems = list.findElements(bySemanticLocator(`{listitem}`))
 */
export function bySemanticLocator(locator: string):
    (driverOrElement: WebDriver|WebElement) =>
        webDriverPromise.Promise<readonly WebElement[]> {
  return (driverOrElement: WebDriver|WebElement) => {
    const driver = driverOrElement instanceof WebElement ?
        driverOrElement.getDriver() :
        driverOrElement;
    const rootEl =
        driverOrElement instanceof WebElement ? driverOrElement : undefined;
    return findElementsBySemanticLocator(driver, locator, rootEl);
  };
}

/**
 * Find all elements in the DOM by the given semantic locator and returns them
 * in the correct order.
 */
export function findElementsBySemanticLocator(
    driver: WebDriver,
    locator: string,
    root?: WebElement,
    ): webDriverPromise.Promise<readonly WebElement[]> {
  return callJsFunction(
      driver, 'findElementsBySemanticLocator', [locator, root]);
}

/**
 * Find the first element in the DOM by the given semantic locator. Throws
 * NoSuchElementError if no matching elements are found.
 */
export function findElementBySemanticLocator(
    driver: WebDriver,
    locator: string,
    root?: WebElement,
    ): webDriverPromise.Promise<WebElement> {
  return callJsFunction(
      driver, 'findElementBySemanticLocator', [locator, root]);
}

/**
 * Builds the most precise locator which matches `element` relative to `root`
 * (or the whole document, if not specified). If `element` does not have a role,
 * return a semantic locator which matches the closest ancestor with a role.
 * "Precise" means that it matches the fewest other elements, while being as
 * short as possible.
 *
 * <p>Returns null if no semantic locator exists for any ancestor.
 */
export function closestPreciseLocatorFor(
    element: WebElement,
    root?: WebElement): webDriverPromise.Promise<string|null> {
  return callJsFunction(
      element.getDriver(), 'closestPreciseLocatorFor', [element, root]);
}

/**
 * Builds the most precise locator which matches `element` relative to `root`
 * (or the whole document, if not specified). "Precise" means that it matches
 * the fewest other elements, while being as short as possible.
 *
 * Returns null if no semantic locator exists.
 */
export function preciseLocatorFor(element: WebElement, root?: WebElement):
    webDriverPromise.Promise<string|null> {
  return callJsFunction(
      element.getDriver(), 'preciseLocatorFor', [element, root]);
}

/**
 * Builds a semantic locator which matches `element` relative to `root`
 * (or the whole document, if not specified). If `element` does not have a role,
 * return a semantic locator which matches the closest ancestor with a role.
 * "Simple" means it will only ever specify one node, even if more nodes would
 * be more precise. i.e. returns `{button 'OK'}`, never `{listitem} {button
 * 'OK'}`. To generate locators for tests, `closestPreciseLocatorFor` or
 * `preciseLocatorFor` are usually more suitable.
 *
 * Returns null if no semantic locator exists for any ancestor.
 */
export function closestSimpleLocatorFor(element: WebElement, root?: WebElement):
    webDriverPromise.Promise<string|null> {
  return callJsFunction(
      element.getDriver(), 'closestSimpleLocatorFor', [element, root]);
}

/**
 * Builds a semantic locator which matches `element`. If `element` does not have
 * a role, return a semantic locator which matches the closest ancestor with a
 * role. "Simple" means it will only ever specify one node, even if more nodes
 * would be more precise. i.e. returns `{button 'OK'}`, never
 * `{listitem} {button 'OK'}`. To generate locators for tests,
 * `closestPreciseLocatorFor` or `preciseLocatorFor` are usually more suitable.
 *
 * Returns null if no semantic locator exists for any ancestor.
 */
export function simpleLocatorFor(element: WebElement):
    webDriverPromise.Promise<string|null> {
  return callJsFunction(element.getDriver(), 'simpleLocatorFor', [element]);
}

/** General semantic locator exception. */
export class SemanticLocatorError extends Error {}

function callJsFunction(
    driver: WebDriver, functionName: string,
    args: Array<string|WebElement|undefined>): webDriverPromise.Promise<any> {
  return loadDefinition(driver).then(() => {
    // Trim entries after 'undefined'
    args = args.slice(0, args.concat(undefined).indexOf(undefined));
    const script = `return window.${functionName}.apply(null, arguments);`;
    return driver.executeScript(script, ...args);
  });
}


function loadDefinition(driver: WebDriver): webDriverPromise.Promise<void> {
  return driver.executeScript('return window.semanticLocatorsReady === true;')
      .then((semanticLocatorsReady: unknown) => {
        if (semanticLocatorsReady !== true) {
          return driver.executeScript(wrapperBin);
        }
        return;
      });
}