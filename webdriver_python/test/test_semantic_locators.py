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
"""Tests for semantic_locators."""

import unittest

from absl.testing import parameterized

from selenium.common.exceptions import (
    InvalidSelectorException,
    NoSuchElementException,
)
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webdriver import WebDriver

from test.webdrivers.webdrivers import DRIVERS
from src.semantic_locators import (
    find_element_by_semantic_locator,
    find_elements_by_semantic_locator,
    precise_locator_for,
    closest_precise_locator_for,
    simple_locator_for,
    closest_simple_locator_for,
)


def _render_html(driver: WebDriver, html: str):
  browser_name = driver.capabilities["browserName"]
  # IE doesn't support data URLs
  if browser_name == "internet explorer":
    driver.get("about:blank")
    escaped_html = html.replace("\\", "\\\\")
    driver.execute_script(f"document.write(\"{escaped_html}\")")
  else:
    driver.get(f"data:text/html;charset=utf-8,{html}")


_ALL_DRIVER_NAMES = list(DRIVERS.keys())


class SemanticLocatorsTest(parameterized.TestCase):
  """Smoke tests and testing things which might break under serialization."""

  @parameterized.product(
      (
          {
              "locator": "{button 'OK'}",
              "html": "<button id='target'>OK</button>"
          },
          {
              "locator": "{button \"OK\"}",
              "html": "<button id='target'>OK</button>"
          },
          {
              "locator": "{list} {listitem}",
              "html": "<ul><li id='target'>foo</li></ul>"
          },
          {
              "locator": "{button '*and_end'}",
              "html": "<button id='target'>beginning_and_end</button>"
          },
          {
              "locator": "{button 'beginning_and*'}",
              "html": "<button id='target'>beginning_and_end</button>"
          },
          {
              "locator": "{button '*and*'}",
              "html": "<button id='target'>beginning_and_end</button>"
          },
          {
              "locator":
                  "{region} outer {list}",
              "html":
                  "<div role='region'><ul id='target'><li><ul><li>foo</li></ul></li></ul></div>"
          },
          {
              "locator":
                  "{button 'блČλñéç‪हिन्दी‬日本語‬‪한국어‬й‪ไ🤖-—–;|<>!\"_+'}",
              "html":
                  "<button id='target' aria-label='блČλñéç‪हिन्दी‬日本語‬‪한국어‬й‪ไ🤖-—–;|<>!&quot;_+'>OK</button>"
          },
          {
              "locator":
                  "{ button '\\'escaped quotes\\\\\\' and unescaped\\\\\\\\'}",
              "html":
                  "<button id='target'>'escaped quotes\\' and unescaped\\\\</button>"
          },
      ),
      driver_name=_ALL_DRIVER_NAMES,
  )
  def test_find_element_finds_elements(self, locator, html, driver_name):
    driver = DRIVERS[driver_name]
    _render_html(driver, html)
    target = find_element_by_semantic_locator(driver, locator)
    self.assertEqual(target.get_attribute("id"), "target")

  @parameterized.parameters(_ALL_DRIVER_NAMES)
  def test_find_elements_finds_duplicates(self, driver_name):
    driver = DRIVERS[driver_name]
    _render_html(
        driver,
        "<button>OK</button><button aria-label='OK'>foo</button><div role='button'>OK</div>"
    )
    self.assertLen(
        find_elements_by_semantic_locator(driver, "{button 'OK'}"), 3)

  @parameterized.parameters(_ALL_DRIVER_NAMES)
  def test_finding_elements_within_context(self, driver_name):
    driver = DRIVERS[driver_name]
    _render_html(
        driver,
        "<button>OK</button><div id='container'><button id='target'>OK</button></div>"
    )
    container = driver.find_element(By.ID, "container")

    element = find_element_by_semantic_locator(driver, "{button 'OK'}",
                                               container)
    self.assertEqual(element.get_attribute("id"), "target")

    elements = find_elements_by_semantic_locator(driver, "{button 'OK'}",
                                                 container)
    self.assertListEqual([element], elements)

  @parameterized.product(
      locator=["{button 'OK'", "{button 'OK\\'}"],
      driver_name=_ALL_DRIVER_NAMES)
  def test_throwing_exceptions_for_invalid_syntax(self, locator, driver_name):
    driver = DRIVERS[driver_name]
    with self.assertRaises(InvalidSelectorException):
      find_element_by_semantic_locator(driver, locator)
    with self.assertRaises(InvalidSelectorException):
      find_elements_by_semantic_locator(driver, locator)

  @parameterized.parameters(_ALL_DRIVER_NAMES)
  def test_throwing_exceptions_for_no_elements_found(self, driver_name):
    driver = DRIVERS[driver_name]
    with self.assertRaises(NoSuchElementException):
      find_element_by_semantic_locator(driver,
                                       "{button 'this label does not exist'}")

  @parameterized.product(
      ({
          "expected": "{button 'OK'}",
          "html": "<button id='target'>OK</button>"
      }, {
          "expected":
              "{listitem} {button 'OK'}",
          "html":
              "<ul><li><button id='target'>OK</button></li></ul><button>OK</button>"
      }, {
          "expected": None,
          "html": "<button><div id='target'>OK</div></button>"
      }),
      driver_name=_ALL_DRIVER_NAMES,
  )
  def test_precise_locator_for_without_root(self, expected, html, driver_name):
    driver = DRIVERS[driver_name]
    _render_html(driver, html)

    target = driver.find_element(By.ID, "target")
    self.assertEqual(precise_locator_for(target), expected)

  @parameterized.product(
      ({
          "expected": "{button 'OK'}",
          "html": "<div id='root'><button id='target'>OK</button></div>"
      }, {
          "expected":
              "{button 'OK'}",
          "html":
              "<div id='root'><ul><li><button id='target'>OK</button></li></ul></div><button>OK</button>"
      }, {
          "expected":
              None,
          "html":
              "<div id='root'><button><div id='target'>OK</div></button></div>"
      }),
      driver_name=_ALL_DRIVER_NAMES,
  )
  def test_precise_locator_for_with_root(self, expected, html, driver_name):
    driver = DRIVERS[driver_name]
    _render_html(driver, html)

    target = driver.find_element(By.ID, "target")
    root = driver.find_element(By.ID, "root")
    self.assertEqual(precise_locator_for(target, root), expected)

  @parameterized.product(
      ({
          "expected": "{button 'OK'}",
          "html": "<button id='target'>OK</button>"
      }, {
          "expected":
              "{listitem} {button 'OK'}",
          "html":
              "<ul><li><button id='target'>OK</button></li></ul><button>OK</button>"
      }, {
          "expected": "{button 'OK'}",
          "html": "<button><div id='target'>OK</div></button>"
      }),
      driver_name=_ALL_DRIVER_NAMES,
  )
  def test_closest_precise_locator_for_without_root(self, expected, html,
                                                    driver_name):
    driver = DRIVERS[driver_name]
    _render_html(driver, html)

    target = driver.find_element(By.ID, "target")
    self.assertEqual(closest_precise_locator_for(target), expected)

  @parameterized.product(
      ({
          "expected": "{button 'OK'}",
          "html": "<div id='root'><button id='target'>OK</button></div>"
      }, {
          "expected":
              "{button 'OK'}",
          "html":
              "<div id='root'><ul><li><button id='target'>OK</button></li></ul></div><button>OK</button>"
      }, {
          "expected":
              "{button 'OK'}",
          "html":
              "<div id='root'><button><div id='target'>OK</div></button></div>"
      }),
      driver_name=_ALL_DRIVER_NAMES,
  )
  def test_closest_precise_locator_for_with_root(self, expected, html,
                                                 driver_name):
    driver = DRIVERS[driver_name]
    _render_html(driver, html)

    target = driver.find_element(By.ID, "target")
    root = driver.find_element(By.ID, "root")
    self.assertEqual(closest_precise_locator_for(target, root), expected)

  @parameterized.parameters(_ALL_DRIVER_NAMES)
  def test_closest_simple_locator_for_without_root(self, driver_name):
    driver = DRIVERS[driver_name]
    _render_html(
        driver,
        "<button>OK</button><ul><li><button><div id='target'>OK</div></button></li></ul>"
    )
    self.assertEqual(
        closest_simple_locator_for(driver.find_element(By.ID, "target")),
        "{button 'OK'}")

  @parameterized.product(
      ({
          "expected":
              "{button 'OK'}",
          "html":
              "<button>OK</button><ul><li id='root'><button><div id='target'>OK</div></button></li></ul>"
      }, {
          "expected":
              None,
          "html":
              "<button>OK</button><ul><li><button id='root'><div id='target'>OK</div></button></li></ul>"
      }),
      driver_name=_ALL_DRIVER_NAMES,
  )
  def test_closest_simple_locator_for_with_root(self, expected, html,
                                                driver_name):
    driver = DRIVERS[driver_name]
    _render_html(driver, html)

    target = driver.find_element(By.ID, "target")
    root = driver.find_element(By.ID, "root")
    self.assertEqual(closest_simple_locator_for(target, root), expected)

  @parameterized.product(
      ({
          "expected":
              "{button 'OK'}",
          "html":
              "<button>OK</button><ul><li><button id='target'><div>OK</div></button></li></ul>"
      }, {
          "expected":
              None,
          "html":
              "<button>OK</button><ul><li><button><div id='target'>OK</div></button></li></ul>"
      }),
      driver_name=_ALL_DRIVER_NAMES,
  )
  def test_simple_locator_for(self, expected, html, driver_name):
    driver = DRIVERS[driver_name]
    _render_html(driver, html)

    target = driver.find_element(By.ID, "target")
    self.assertEqual(simple_locator_for(target), expected)

  @classmethod
  def tearDownClass(cls):
    for driver in DRIVERS.values():
      driver.quit()
    super().tearDownClass()


if __name__ == "__main__":
  unittest.main()
