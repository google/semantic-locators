# Copyright 2021 The Semantic Locators Authors
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Semantic locator support for WebDriver.

See https://github.com/google/semantic-locators for docs.
"""

from typing import List, Optional, Sequence, Union

import importlib_resources
from selenium.common.exceptions import InvalidSelectorException
from selenium.common.exceptions import JavascriptException
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.remote.webdriver import WebDriver
from selenium.webdriver.remote.webdriver import WebElement


JS_IMPLEMENTATION = importlib_resources.read_text(
    "src.data",
    "wrapper_bin.js")


def find_elements_by_semantic_locator(
    driver: WebDriver,
    locator: str,
    root: Optional[WebElement] = None,
) -> List[WebElement]:
  """Find all elements which match the semantic locator `locator`.

  Args:
    driver: A WebDriver instance.
    locator: A semantic locator to search for.
    root: Optional; The element within which to search for `locator`. Defaults
      to all elements in the document.

  Returns:
    All elements which match `locator` (under `root` if specified)

  Raises:
    InvalidSelectorException: Locator syntax is invalid.
    SemanticLocatorException: Failed to find elements by locator.
  """
  args = [locator] if root is None else [locator, root]
  return _call_js_function(driver, "findElementsBySemanticLocator", args)


def find_element_by_semantic_locator(
    driver: WebDriver,
    locator: str,
    root: Optional[WebElement] = None,
) -> WebElement:
  """Find the first element which matches the semantic locator `locator`.

  Args:
    driver: A WebDriver instance.
    locator: A semantic locator to search for.
    root: Optional; The element within which to search for `locator`. Defaults
      to all elements in the document.

  Returns:
    The first element which matches `locator` (under `root` if specified)

  Raises:
    NoSuchElementException: No element matched `locator`.
    InvalidSelectorException: Locator syntax is invalid.
    SemanticLocatorException: Failed to find elements by locator.
  """
  args = [locator] if root is None else [locator, root]
  return _call_js_function(driver, "findElementBySemanticLocator", args)


def closest_precise_locator_for(element: WebElement,
                                root: Optional[WebElement] = None):
  """Builds the most precise locator which matches `element`.

  If `element` does not have a role, return a semantic locator which matches the
  closest ancestor with a role. "Precise" means that it matches the fewest other
  elements, while being as short as possible.

  Args:
    element: A WebElement to generate a locator for.
    root: Optional; The element relative to which the locator will be generated.
      Defaults to the whole document.

  Returns:
    The locator for `element` or its closest semantic ancestor. Returns None if
    no semantic locator exists for any ancestor.

  Raises:
    SemanticLocatorException: Failed to generate locator.
  """
  args = [element] if root is None else [element, root]
  return _call_js_function(element.parent, "closestPreciseLocatorFor", args)


def precise_locator_for(element: WebElement, root: Optional[WebElement] = None):
  """Builds a precise locator matching `element`.

  "Precise" means that it matches the fewest other elements, while being as
  short as possible.

  Args:
    element: A WebElement to generate a locator for.
    root: Optional; The element relative to which the locator will be generated.
      Defaults to the whole document.

  Returns:
    The locator for `element` or its closest semantic ancestor. Returns None if
    no semantic locator exists.

  Raises:
    SemanticLocatorException: Failed to generate locator.
  """
  args = [element] if root is None else [element, root]
  return _call_js_function(element.parent, "preciseLocatorFor", args)


def closest_simple_locator_for(element: WebElement,
                               root: Optional[WebElement] = None):
  """Builds a semantic locator which matches `element`.

  If `element` does not have a role, return a semantic locator which matches the
  closest ancestor with a role.  "Simple" means it will only ever specify one
  node, even if more nodes would be more precise. i.e. returns `{button 'OK'}`,
  never `{listitem} {button 'OK'}`. To generate locators for tests,
  `closestPreciseLocatorFor` or `preciseLocatorFor` are usually more suitable.

  Args:
    element: A WebElement to generate a locator for.
    root: Optional; The element relative to which the locator will be generated.
      Defaults to the whole document.

  Returns:
    The locator for `element` or its closest semantic ancestor. Returns None if
    no semantic locator exists for any ancestor.

  Raises:
    SemanticLocatorException: Failed to generate locator.
  """
  args = [element] if root is None else [element, root]
  return _call_js_function(element.parent, "closestSimpleLocatorFor", args)


def simple_locator_for(element: WebElement):
  """Builds a locator with only one part which matches `element`.

  "Simple" means it will only ever specify one node, even if more nodes would be
  more precise. i.e. returns `{button 'OK'}`, never `{listitem} {button 'OK'}`.
  To generate locators for tests, `closestPreciseLocatorFor` or
  `preciseLocatorFor` are usually more suitable.

  Args:
    element: A WebElement to generate a locator for.

  Returns:
    The locator for `element` or its closest semantic ancestor. Returns None if
    no semantic locator exists.

  Raises:
    SemanticLocatorException: Failed to generate locator.
  """
  return _call_js_function(element.parent, "simpleLocatorFor", [element])


class SemanticLocatorException(Exception):
  """General semantic locator exception."""

  def __init__(self, *args: object):
    super().__init__(args)


def _call_js_function(
    driver: WebDriver,
    function: str,
    # Collection is better than sequence here, blocked by
    # https://github.com/PyCQA/pylint/issues/2377
    args: Sequence[Union[str, WebElement]],
):
  _load_definition(driver)
  script = f"return window.{function}.apply(null, arguments);"
  try:
    return driver.execute_script(script, *args)
  except JavascriptException as err:
    raise _deserialize_exception(err) from err


def _load_definition(driver: WebDriver):
  if driver.execute_script("return window.semanticLocatorsReady !== true;"):
    driver.execute_script(JS_IMPLEMENTATION)


def _deserialize_exception(err: JavascriptException) -> Exception:
  # The message sent back from browsers looks something like:
  # "Error in javascript: NoSuchElementError: nothing found...."
  # Where the "Error in javascript" string varies between browsers
  full_message = err.msg
  parts = full_message.split(":", 2)
  if len(parts) != 3:
    return SemanticLocatorException(
        f"Failed to find elements by semantic locators. {full_message}")

  error_type = parts[1].strip()
  message = parts[2].strip()

  if error_type == "NoSuchElementError":
    return NoSuchElementException(message)
  if error_type == "InvalidLocatorError":
    return InvalidSelectorException(message)
  return SemanticLocatorException(
      f"Failed to find elements by semantic locators. {error_type}: {message}")
