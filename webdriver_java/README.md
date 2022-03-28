# Semantic Locators in Java WebDriver

Semantic locators can be used with Selenium WebDriver in a similar way to
`ByXPath` or `ByCssSelector`. Currently only available for Java 8+.

Add the following to your `pom.xml`:

```xml
<dependency>
  <groupId>com.google.semanticlocators</groupId>
  <artifactId>semantic-locators</artifactId>
  <version>2.1.0</version>
  <scope>test</scope>
</dependency>
```

Once installed, use Semantic Locators as follows:

```java
import com.google.semanticlocators.BySemanticLocator;
...

WebElement searchButton = driver.findElement(new BySemanticLocator("{button 'Google search'}"));
ArrayList<WebElement> allButtons = driver.findElements(new BySemanticLocator("{button}"));

String generated = BySemanticLocator.closestPreciseLocatorFor(searchButton); // {button 'Google search'}
```

General Semantic Locator documentation can be found on
[GitHub](http://github.com/google/semantic-locators#readme).
