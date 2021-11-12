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

import static com.google.common.truth.Truth.assertThat;
import static com.google.semanticlocators.WebDrivers.DRIVERS;
import static java.util.Arrays.asList;
import static org.junit.Assert.assertThrows;

import com.google.common.collect.ImmutableSet;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import junitparams.JUnitParamsRunner;
import junitparams.Parameters;
import org.junit.AfterClass;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.openqa.selenium.By;
import org.openqa.selenium.InvalidSelectorException;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.NoSuchElementException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.remote.RemoteWebDriver;

@RunWith(JUnitParamsRunner.class)
public final class BySemanticLocatorTest {
  @AfterClass
  public static void quitServer() throws Exception {
    DRIVERS.values().forEach(WebDriver::quit);
  }

  @Test
  @Parameters(method = "findElementTests")
  public void findElement_findsElements(String semantic, String html, String driverName)
      throws Exception {
    WebDriver driver = getDriver(driverName);
    renderHtml(html, driver);
    WebElement element = driver.findElement(new BySemanticLocator(semantic));
    assertThat(element.getAttribute("id")).isEqualTo("target");
  }

  private static List<List<String>> findElementTests() {
    return withAllDriverNames(
        asList(
            asList("{button 'OK'}", "<button id='target'>OK</button>"),
            asList("{button \"OK\"}", "<button id='target'>OK</button>"),
            asList("{list} {listitem}", "<ul><li id='target'>foo</li></ul>"),
            asList("{button '*and_end'}", "<button id='target'>beginning_and_end</button>"),
            asList("{button 'beginning_and*'}", "<button id='target'>beginning_and_end</button>"),
            asList("{button '*and*'}", "<button id='target'>beginning_and_end</button>"),
            asList(
                "{region} outer {list}",
                "<div role='region'><ul id='target'><li><ul><li>foo</li></ul></li></ul></div>"),
            asList(
                "{button"
                    + " 'блČλñéç\u202aहिन्दी\u202c日本語\u202c\u202a한국어\u202cй\u202aไ🤖-—–;|<>!\"_+'}",
                "<button id='target'"
                    + " aria-label='блČλñéç\u202aहिन्दी\u202c日本語\u202c\u202a한국어\u202cй\u202aไ🤖-—–;|<>!&quot;_+'>OK</button>"),
            asList(
                "{ button '\\'escaped quotes\\\\\\' and unescaped\\\\\\\\'}",
                "<button id='target'>'escaped quotes\\' and unescaped\\\\</button>")));
  }

  @Test
  @Parameters(method = "getAllDriverNames")
  public void findElements_findsDuplicates(String driverName) throws Exception {
    WebDriver driver = getDriver(driverName);
    renderHtml(
        "<button>OK</button><button aria-label='OK'>foo</button><div role='button'>OK</div>",
        driver);
    assertThat(driver.findElements(new BySemanticLocator("{button 'OK'}"))).hasSize(3);
  }

  private static ImmutableSet<String> getAllDriverNames() {
    return DRIVERS.keySet();
  }

  @Test
  @Parameters(method = "getAllDriverNames")
  public void findElement_findsWithinContext(String driverName) throws Exception {
    WebDriver driver = getDriver(driverName);
    renderHtml(
        "<button>OK</button><div id='container'><button id='target'>OK</button></div>", driver);
    WebElement element =
        driver.findElement(By.id("container")).findElement(new BySemanticLocator("{button 'OK'}"));
    assertThat(element.getAttribute("id")).isEqualTo("target");
  }

  @Test
  @Parameters(method = "getAllDriverNames")
  public void findElements_findsWithinContext(String driverName) throws Exception {
    WebDriver driver = getDriver(driverName);
    renderHtml(
        "<button>OK</button><div id='container'><button id='target'>OK</button></div>", driver);
    List<WebElement> elements =
        driver.findElement(By.id("container")).findElements(new BySemanticLocator("{button 'OK'}"));
    assertThat(elements).hasSize(1);
  }

  @Test
  @Parameters(method = "invalidSyntaxTests")
  public void findElements_throwsExceptionForInvalidSyntax(String semantic, String driverName)
      throws Exception {
    WebDriver driver = getDriver(driverName);
    assertThrows(
        InvalidSelectorException.class, () -> driver.findElements(new BySemanticLocator(semantic)));
  }

  private static List<List<String>> invalidSyntaxTests() {
    return withAllDriverNames(asList(asList("{button 'OK'"), asList("{button 'OK\\'}")));
  }

  @Test
  @Parameters(method = "getAllDriverNames")
  public void findElement_throwsExceptionForNoElementsFound(String driverName) throws Exception {
    WebDriver driver = getDriver(driverName);
    assertThrows(
        NoSuchElementException.class,
        () -> driver.findElement(new BySemanticLocator("{button 'this label does not exist'}")));
  }

  @Test
  @Parameters(method = "preciseLocatorForWithoutRootTests")
  public void preciseLocatorFor_generatesLocatorForElement(
      String expected, String html, String driverName) {
    WebDriver driver = getDriver(driverName);
    renderHtml(html, driver);

    WebElement target = driver.findElement(By.id("target"));
    assertThat(BySemanticLocator.preciseLocatorFor(target)).isEqualTo(expected);
  }

  private static List<List<String>> preciseLocatorForWithoutRootTests() {
    return withAllDriverNames(
        asList(
            asList("{button 'OK'}", "<button id='target'>OK</button>"),
            asList(
                "{listitem} {button 'OK'}",
                "<ul><li><button id='target'>OK</button></li></ul><button>OK</button>"),
            asList(null, "<button><div id='target'>OK</div></button>")));
  }

  @Test
  @Parameters(method = "preciseLocatorForWithRootTests")
  public void preciseLocatorFor_acceptsRootEl(String expected, String html, String driverName) {
    WebDriver driver = getDriver(driverName);
    renderHtml(html, driver);

    WebElement target = driver.findElement(By.id("target"));
    WebElement root = driver.findElement(By.id("root"));
    assertThat(BySemanticLocator.preciseLocatorFor(target, root)).isEqualTo(expected);
  }

  private static List<List<String>> preciseLocatorForWithRootTests() {
    return withAllDriverNames(
        asList(
            asList("{button 'OK'}", "<div id='root'><button id='target'>OK</button></div>"),
            asList(
                "{button 'OK'}",
                "<div id='root'><ul><li><button id='target'>OK</button></li></ul></div>"
                    + "<button>OK</button>"),
            asList(null, "<div id='root'><button><div id='target'>OK</div></button></div>")));
  }

  @Test
  @Parameters(method = "closestPreciseLocatorForWithoutRootTests")
  public void closestPreciseLocatorFor_generatesLocatorForElement(
      String expected, String html, String driverName) {
    WebDriver driver = getDriver(driverName);
    renderHtml(html, driver);

    WebElement target = driver.findElement(By.id("target"));
    assertThat(BySemanticLocator.closestPreciseLocatorFor(target)).isEqualTo(expected);
  }

  private static List<List<String>> closestPreciseLocatorForWithoutRootTests() {
    return withAllDriverNames(
        asList(
            asList("{button 'OK'}", "<button id='target'>OK</button>"),
            asList(
                "{listitem} {button 'OK'}",
                "<ul><li><button id='target'>OK</button></li></ul><button>OK</button>"),
            asList("{button 'OK'}", "<button><div id='target'>OK</div></button>")));
  }

  @Test
  @Parameters(method = "closestPreciseLocatorForWithRootTests")
  public void closestPreciseLocatorFor_acceptsRootEl(
      String expected, String html, String driverName) {
    WebDriver driver = getDriver(driverName);
    renderHtml(html, driver);

    WebElement target = driver.findElement(By.id("target"));
    WebElement root = driver.findElement(By.id("root"));
    assertThat(BySemanticLocator.closestPreciseLocatorFor(target, root)).isEqualTo(expected);
  }

  private static List<List<String>> closestPreciseLocatorForWithRootTests() {
    return withAllDriverNames(
        asList(
            asList("{button 'OK'}", "<div id='root'><button id='target'>OK</button></div>"),
            asList(
                "{button 'OK'}",
                "<div id='root'><ul><li><button id='target'>OK</button></li></ul></div>"
                    + "<button>OK</button>"),
            asList(
                "{button 'OK'}",
                "<div id='root'><button><div id='target'>OK</div></button></div>")));
  }

  @Test
  @Parameters(method = "closestSimpleLocatorForWithoutRootTests")
  public void closestSimpleLocatorFor_generatesSimpleLocators(
      String expected, String html, String driverName) {
    WebDriver driver = getDriver(driverName);
    renderHtml(html, driver);

    WebElement target = driver.findElement(By.id("target"));
    assertThat(BySemanticLocator.closestSimpleLocatorFor(target)).isEqualTo(expected);
  }

  private static List<List<String>> closestSimpleLocatorForWithoutRootTests() {
    return withAllDriverNames(
        asList(
            asList(
                "{button 'OK'}",
                "<button>OK</button><ul><li><button><div"
                    + " id='target'>OK</div></button></li></ul>")));
  }

  @Test
  @Parameters(method = "closestSimpleLocatorForWithRootTests")
  public void closestSimpleLocatorFor_acceptsRootEl(
      String expected, String html, String driverName) {
    WebDriver driver = getDriver(driverName);
    renderHtml(html, driver);

    WebElement target = driver.findElement(By.id("target"));
    WebElement root = driver.findElement(By.id("root"));
    assertThat(BySemanticLocator.closestSimpleLocatorFor(target, root)).isEqualTo(expected);
  }

  private static List<List<String>> closestSimpleLocatorForWithRootTests() {
    return withAllDriverNames(
        asList(
            asList(
                "{button 'OK'}",
                "<button>OK</button><ul><li id='root'><button><div"
                    + " id='target'>OK</div></button></li></ul>"),
            asList(
                null,
                "<button>OK</button><ul><li><button id='root'><div"
                    + " id='target'>OK</div></button></li></ul>")));
  }

  @Test
  @Parameters(method = "simpleLocatorForTests")
  public void simpleLocatorFor_generatesSimpleLocators(
      String expected, String html, String driverName) {
    WebDriver driver = getDriver(driverName);
    renderHtml(html, driver);

    WebElement target = driver.findElement(By.id("target"));
    assertThat(BySemanticLocator.simpleLocatorFor(target)).isEqualTo(expected);
  }

  private static List<List<String>> simpleLocatorForTests() {
    return withAllDriverNames(
        asList(
            asList(
                "{button 'OK'}",
                "<button>OK</button><ul><li id='root'><button"
                    + " id='target'><div>OK</div></button></li></ul>"),
            asList(
                null,
                "<button>OK</button><ul><li id='root'><button><div"
                    + " id='target'>OK</div></button></li></ul>")));
  }

  private static void renderHtml(String html, WebDriver driver) {
    String browserName = ((RemoteWebDriver) driver).getCapabilities().getBrowserName();
    // IE doesn't support data URLs
    if (browserName.equals("internet explorer")) {
      driver.get("about:blank");
      ((JavascriptExecutor) driver)
          .executeScript(
              "document.write(\""
                  + html.replace("\\", "\\\\") // Extra escape for the JS string
                  + "\")");

    } else {
      driver.get("data:text/html;charset=utf-8," + html);
    }
  }

  private static WebDriver getDriver(String driverName) {
    WebDriver driver = DRIVERS.get(driverName);
    if (driver == null) {
      throw new IllegalArgumentException(
          driverName
              + " is not a known driver. Known drivers: "
              + String.join(", ", DRIVERS.keySet()));
    }
    return driver;
  }

  /**
   * Return the cross product of `allParams` with all driver names. That is, return a list of each
   * parameter combination in `allParams` with each browser name appended.
   */
  private static List<List<String>> withAllDriverNames(Collection<Collection<String>> allParams) {
    List<List<String>> result = new ArrayList<>();
    for (Collection<String> params : allParams) {
      for (String finalParam : DRIVERS.keySet()) {
        List<String> combined = new ArrayList<>(params);
        combined.add(finalParam);
        result.add(combined);
      }
    }
    return result;
  }
}
