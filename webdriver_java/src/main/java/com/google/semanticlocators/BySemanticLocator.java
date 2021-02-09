package com.google.semanticlocators;

import static java.lang.String.format;
import static java.nio.charset.StandardCharsets.UTF_8;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.stream.Collectors;
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
public class BySemanticLocator extends By {
  private static final String JS_IMPLEMENTATION;

  static {
    try {
      try (InputStream in = BySemanticLocator.class.getResourceAsStream("/wrapper_bin.js")) {
        JS_IMPLEMENTATION =
            new BufferedReader(new InputStreamReader(in, UTF_8))
                .lines()
                .collect(Collectors.joining("\n"));
      }
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
    Object result = callJsFunction(context, "findElementsBySemanticLocator", semanticLocator);
    @SuppressWarnings("unchecked")
    ArrayList<WebElement> cast = (ArrayList<WebElement>) result;
    return cast;
  }

  @Override
  public WebElement findElement(SearchContext context) {
    return (WebElement) callJsFunction(context, "findElementBySemanticLocator", semanticLocator);
  }

  protected static final Object callJsFunction(
      SearchContext context, String function, Object argument) {
    loadDefinition(context);

    String script = "return window." + function + ".apply(null, arguments);";

    Object result;
    try {
      result =
          context instanceof WebElement
              ? getExecutor(context).executeScript(script, argument, context)
              : getExecutor(context).executeScript(script, argument);
    } catch (JavascriptException e) {
      throw deserializeException(e);
    }
    return result;
  }

  private static void loadDefinition(SearchContext context) {
    // TODO(alexlloyd) it might actually be more efficient to load+call semantic locators in one
    // script each time. It depends how the round trip of a call to executeScript compares with the
    // time to load the definition
    JavascriptExecutor executor = getExecutor(context);
    if ((Boolean) executor.executeScript("return window.semanticLocatorsReady !== true;")) {
      executor.executeScript(JS_IMPLEMENTATION);
    }
  }

  private static JavascriptExecutor getExecutor(SearchContext context) {
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
