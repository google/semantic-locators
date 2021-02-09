package com.google.semanticlocators;

/**
 * General exception from Semantic Locators. If a native WebDriver exception is more specific (such
 * as NoSuchElementException), that will be thrown instead.
 */
public class SemanticLocatorException extends RuntimeException {
  public SemanticLocatorException(String message) {
    super(message);
  }
}
