package com.google.semanticlocators;

import static com.google.common.truth.Truth.assertThat;
import static java.util.Arrays.asList;
import static org.junit.Assert.assertThrows;

import com.google.common.collect.ImmutableMap;
import com.google.common.collect.ImmutableSet;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import junitparams.JUnitParamsRunner;
import junitparams.Parameters;
import org.junit.AfterClass;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.openqa.selenium.InvalidSelectorException;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.NoSuchElementException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.remote.RemoteWebDriver;

@RunWith(JUnitParamsRunner.class)
public final class BySemanticLocatorTest {
  // Use a string to identify browsers so the test names are readable
  private static final ImmutableMap<String, WebDriver> DRIVERS =
      ImmutableMap.of(
          "chrome", new ChromeDriver(),
          "firefox", new FirefoxDriver());

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
  public void findElements_throwsExceptionForNoElementsFound(String driverName) throws Exception {
    WebDriver driver = getDriver(driverName);
    assertThrows(
        NoSuchElementException.class,
        () -> driver.findElement(new BySemanticLocator("{button 'this label does not exist'}")));
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
      driver.get("data:text/html," + html);
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
