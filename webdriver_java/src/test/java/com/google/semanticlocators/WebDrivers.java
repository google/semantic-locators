/*
 * Copyright (C) 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.google.semanticlocators;

import com.google.common.collect.ImmutableMap;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.firefox.FirefoxOptions;

/**
 * Provides WebDriver instances to the test. This constant is kept in a separate class so internal +
 * open source code can differ.
 */
final class WebDrivers {
  // Use a string to identify browsers so the test names are readable
  public static final ImmutableMap<String, WebDriver> DRIVERS;

  static {
    ChromeOptions chromeOptions = new ChromeOptions();
    chromeOptions.addArguments("--headless");

    FirefoxOptions firefoxOptions = new FirefoxOptions();
    firefoxOptions.addArguments("--headless");

    DRIVERS =
        ImmutableMap.of(
            "chrome", new ChromeDriver(chromeOptions),
            "firefox", new FirefoxDriver(firefoxOptions));
  }

  private WebDrivers() {}
}
