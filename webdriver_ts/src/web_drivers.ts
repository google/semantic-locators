/**
 * @license
 * Copyright 2021 The Semantic Locators Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import {Builder, WebDriver} from 'selenium-webdriver';
import {Options as ChromeOptions} from 'selenium-webdriver/chrome';
import {Options as FirefoxOptions} from 'selenium-webdriver/firefox';

/** A map of WebDriver instances to test over. */
export const DRIVERS = new Map<string, () => WebDriver>([
  [
    'Chrome',
    () => {
      const chromeOptions = new ChromeOptions();
      chromeOptions.addArguments('--headless');
      return new Builder()
          .forBrowser('chrome')
          .setChromeOptions(chromeOptions)
          .build();
    },
  ],
  [
    'FireFox',
    () => {
      const firefoxOptions = new FirefoxOptions();
      firefoxOptions.addArguments('--headless');
      return new Builder()
          .forBrowser('firefox')
          .setFirefoxOptions(firefoxOptions)
          .build();
    },
  ],
]);
