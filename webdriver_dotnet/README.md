# Semantic Locators in C# WebDriver

Semantic locators can be used with Selenium WebDriver in a similar way to
`ByXPath` or `ByCssSelector`.

.NET 5 is currently the only supported version of dotnet

Add the NuGet package to your project (Note that this is not on NuGet yet)
To build the package, run `dotnet publish` in the `webdriver_dotnet\SemanticLocators` directory

Once installed, use Semantic Locators as follows:

```csharp
using SemanticLocators;
...

IWebElement searchButton = driver.FindElement(new BySemanticLocator("{button 'Google search'}"));
List<IWebElement> allButtons = driver.FindElements(new BySemanticLocator("{button}"));

string generated = BySemanticLocator.ClosestPreciseLocatorFor(searchButton); // {button 'Google search'}
```

General Semantic Locator documentation can be found on
[GitHub](http://github.com/google/semantic-locators#readme).
