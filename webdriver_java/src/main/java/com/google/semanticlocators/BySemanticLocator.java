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

import static java.lang.String.format;
import static java.nio.charset.StandardCharsets.UTF_8;
import static java.util.stream.Collectors.joining;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;
import org.openqa.selenium.By;
import org.openqa.selenium.InvalidSelectorException;
import org.openqa.selenium.JavascriptException;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.NoSuchElementException;
import org.openqa.selenium.SearchContext;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.remote.RemoteWebElement;

/**
 * Locate elements in a document by a semantic locator. See
 * http://github.com/google/semantic-locators#readme for documentation on Semantic Locators.
 * Example:
 *
 * <pre>{@code
 * WebElement searchButton = driver.findElement(new BySemanticLocator("{button 'Google search'}"));
 * ArrayList<WebElement> allButtons = driver.findElements(new BySemanticLocator("{button}"));
 * }</pre>
 */
// TODO(alexlloyd) make class final again
public class BySemanticLocator extends By {
  private static final String JS_IMPLEMENTATION;

  static {
    try (InputStream in = BySemanticLocator.class.getResourceAsStream("wrapper_bin.js")) {
      if (in == null) {
        throw new ExceptionInInitializerError(
            "Failed to initialize semantic locators - couldn't open resource wrapper_bin.js");
      }
      JS_IMPLEMENTATION =
          new BufferedReader(new InputStreamReader(in, UTF_8)).lines().collect(joining("\n"));
    } catch (IOException e) {
      throw new ExceptionInInitializerError(e);
    }
  }

  private final String semanticLocator;

  /**
   * Construct a BySemanticLocator object with the rules defined at
   * https://www.w3.org/TR/html-aria/#docconformance.
   */
  public BySemanticLocator(String semanticLocator) {
    this.semanticLocator = semanticLocator;
  }

  @Override
  public ArrayList<WebElement> findElements(SearchContext context) {
    Object result =
        callJsFunction(
            getExecutor(context),
            "findElementsBySemanticLocator",
            getArgs(semanticLocator, context));
    @SuppressWarnings("unchecked")
    ArrayList<WebElement> cast = (ArrayList<WebElement>) result;
    return cast;
  }

  @Override
  public WebElement findElement(SearchContext context) {
    return (WebElement)
        callJsFunction(
            getExecutor(context),
            "findElementBySemanticLocator",
            getArgs(semanticLocator, context));
  }

  private static Object[] getArgs(String semanticLocator, SearchContext context) {
    return (context instanceof WebElement
        ? new Object[] {semanticLocator, context}
        : new Object[] {semanticLocator});
  }

  /**
   * Builds the most precise locator which matches `element`. If `element` does not have a role,
   * return a semantic locator which matches the closest ancestor with a role. "Precise" means that
   * it matches the fewest other elements, while being as short as possible.
   *
   * <p>Returns null if no semantic locator exists for any ancestor.
   */
  public static String closestPreciseLocatorFor(WebElement element) {
    return (String) callJsFunction(getExecutor(element), "closestPreciseLocatorFor", element);
  }

  /**
   * Builds the most precise locator which matches `element`. If `element` does not have a role,
   * return a semantic locator which matches the closest ancestor with a role. "Precise" means that
   * it matches the fewest other elements, while being as short as possible.
   *
   * <p>Returns null if no semantic locator exists for any ancestor.
   */
  public static String closestPreciseLocatorFor(WebElement element, WebElement rootEl) {
    return (String)
        callJsFunction(getExecutor(element), "closestPreciseLocatorFor", element, rootEl);
  }

  /**
   * Builds the most precise locator which matches `element`. "Precise" means that it matches the
   * fewest other elements, while being as short as possible.
   *
   * <p>Returns null if no semantic locator exists.
   */
  public static String preciseLocatorFor(WebElement element) {
    return (String) callJsFunction(getExecutor(element), "preciseLocatorFor", element);
  }

  /**
   * Builds the most precise locator which matches `element`. "Precise" means that it matches the
   * fewest other elements, while being as short as possible.
   *
   * <p>Returns null if no semantic locator exists.
   */
  public static String preciseLocatorFor(WebElement element, WebElement rootEl) {
    return (String) callJsFunction(getExecutor(element), "preciseLocatorFor", element, rootEl);
  }

  /**
   * Builds a semantic locator which matches `element`. If `element` does not have a role, return a
   * semantic locator which matches the closest ancestor with a role. "Simple" means it will only
   * ever specify one node, even if more nodes would be more precise. i.e. returns `{button 'OK'}`,
   * never `{listitem} {button 'OK'}`. To generate locators for tests, `closestPreciseLocatorFor` or
   * `preciseLocatorFor` are usually more suitable.
   *
   * <p>Returns null if no semantic locator exists for any ancestor.
   */
  public static String closestSimpleLocatorFor(WebElement element) {
    return (String) callJsFunction(getExecutor(element), "closestSimpleLocatorFor", element);
  }

  /**
   * Builds a semantic locator which matches `element`. If `element` does not have a role, return a
   * semantic locator which matches the closest ancestor with a role. "Simple" means it will only
   * ever specify one node, even if more nodes would be more precise. i.e. returns `{button 'OK'}`,
   * never `{listitem} {button 'OK'}`. To generate locators for tests, `closestPreciseLocatorFor` or
   * `preciseLocatorFor` are usually more suitable.
   *
   * <p>Returns null if no semantic locator exists for any ancestor.
   */
  public static String closestSimpleLocatorFor(WebElement element, WebElement rootEl) {
    return (String)
        callJsFunction(getExecutor(element), "closestSimpleLocatorFor", element, rootEl);
  }

  /**
   * Builds a locator with only one part which matches `element`. "Simple" means it will only ever
   * specify one node, even if more nodes would be more precise. i.e. returns `{button 'OK'}`, never
   * `{listitem} {button 'OK'}`. To generate locators for tests, `closestPreciseLocatorFor` or
   * `preciseLocatorFor` are usually more suitable.
   *
   * <p>Returns null if no semantic locator exists.
   */
  public static String simpleLocatorFor(WebElement element) {
    return (String) callJsFunction(getExecutor(element), "simpleLocatorFor", element);
  }

  protected static final Object callJsFunction(
      JavascriptExecutor executor, String function, Object... args) {
    loadDefinition(executor);
    String script = "return window." + function + ".apply(null, arguments);";

    try {
      return executor.executeScript(script, args);
    } catch (JavascriptException e) {
      throw deserializeException(e);
    }
  }

  private static void loadDefinition(JavascriptExecutor executor) {
    // TODO(alexlloyd) it might actually be more efficient to load+call semantic locators in one
    // script each time. It depends how the round trip of a call to executeScript compares with the
    // time to load the definition
    if ((Boolean) executor.executeScript("return window.semanticLocatorsReady !== true;")) {
      executor.executeScript(JS_IMPLEMENTATION);
    }
  }

  protected static JavascriptExecutor getExecutor(SearchContext context) {
    if (context instanceof JavascriptExecutor) {
      return (JavascriptExecutor) context;
    } else if (context instanceof RemoteWebElement) {
      return (JavascriptExecutor) ((RemoteWebElement) context).getWrappedDriver();
    } else {
      throw new SemanticLocatorException(
          String.format("No JavaScriptExecutor available from context %s", context));
    }
  }

  private static RuntimeException deserializeException(JavascriptException e) {
    // The message sent back from browsers looks something like:
    // "Error in javascript: NoSuchElementError: nothing found...."
    // Where the "Error in javascript" string varies between browsers
    String message = e.getMessage();
    String[] parts = message.split(":", 3);
    if (parts.length != 3) {
      return new SemanticLocatorException(
          String.format("Failed to find elements by semantic locators. %s", message));
    }
    switch (parts[1].trim()) {
      case "NoSuchElementError":
        return new NoSuchElementException(parts[2].trim());
      case "InvalidLocatorError":
        return new InvalidSelectorException(parts[2].trim());
      default:
        return new SemanticLocatorException(
            format("Failed to find elements by semantic locators. %s:%s", parts[1], parts[2]));
    }
  }

  @Override
  public String toString() {
    return "BySemanticLocator: " + semanticLocator;
  }
}
