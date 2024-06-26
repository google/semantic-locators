//-----------------------------------------------------------------------
// <copyright file="SemanticLocatorException.cs" company="The Semantic Locators Authors">
//
// Copyright 2021 The Semantic Locators Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// </copyright>
//-----------------------------------------------------------------------
using NUnit.Framework;
using OpenQA.Selenium;
using System.Collections.Generic;

namespace SemanticLocators.Tests
{
    [TestFixture]
    public class Tests : TestBase
    {
        [Test]
        [TestCaseSource(nameof(Tests.FindElementTests))]
        public void FindElement(TestAssignment assignment)
        {
            IWebDriver driver = GetDriver(assignment.BrowserName);
            RenderHtml(assignment.Html, driver);
            IWebElement element = driver.FindElement(new BySemanticLocator(assignment.Semantic));
            Assert.That(element.GetAttribute("id").Equals("target"));
        }

        [Test]
        [TestCaseSource(nameof(TestBase.GetAllDriverNames))]
        public void FindElements_FindsDuplicates(string driverName)
        {
            IWebDriver driver = GetDriver(driverName);
            RenderHtml("<button>OK</button><button aria-label='OK'>foo</button><div role='button'>OK</div>", driver);
            Assert.That(driver.FindElements(new BySemanticLocator("{button 'OK'}")).Count == 3);
        }

        [Test]
        [TestCaseSource(nameof(TestBase.GetAllDriverNames))]
        public void FindElement_FindsWithinContext(string driverName)
        {
            IWebDriver driver = GetDriver(driverName);
            RenderHtml("<button>OK</button><div id='container'><button id='target'>OK</button></div>", driver);
            IWebElement element = driver.FindElement(By.Id("container")).FindElement(new BySemanticLocator("{button 'OK'}"));
            Assert.That(element.GetAttribute("id").Equals("target"));
        }

        [Test]
        [TestCaseSource(nameof(TestBase.GetAllDriverNames))]
        public void FindElements_FindsWithinContext(string driverName)
        {
            IWebDriver driver = GetDriver(driverName);
            RenderHtml("<button>OK</button><div id='container'><button id='target'>OK</button></div>", driver);
            var elements = driver.FindElement(By.Id("container")).FindElements(new BySemanticLocator("{button 'OK'}"));
            Assert.That(elements.Count == 1);
          }

        [Test]
        [TestCaseSource(nameof(TestBase.InvalidSyntaxTests))]
        public void FindElements_ThrowsExceptionForInvalidSyntax(TestAssignment assignment)
        {
            IWebDriver driver = GetDriver(assignment.BrowserName);
            Assert.Throws(typeof(InvalidSelectorException), () => driver.FindElements(new BySemanticLocator(assignment.Semantic)));
        }

        [Test]
        [TestCaseSource(nameof(TestBase.GetAllDriverNames))]
        public void FindElement_ThrowsExceptionForNoElementFound(string driverName)
        {
            IWebDriver driver = GetDriver(driverName);
            Assert.Throws(typeof(NoSuchElementException), () => driver.FindElement(new BySemanticLocator("{button 'this label does not exist'}")));
        }

        [Test]
        [TestCaseSource(nameof(TestBase.PreciseLocatorForWithoutRootTests))]
        public void PreciseLocatorFor_GeneratesLocatorForElement(TestAssignment assignment)
        {
            IWebDriver driver = GetDriver(assignment.BrowserName);
            RenderHtml(assignment.Html, driver);

            IWebElement target = driver.FindElement(By.Id("target"));
            Assert.That(assignment.Semantic == BySemanticLocator.PreciseLocatorFor(target));
        }

        [Test]
        [TestCaseSource(nameof(TestBase.PreciseLocatorForWithRootTests))]
        public void PreciseLocatorFor_AcceptsRootEl(TestAssignment assignment)
        {
            IWebDriver driver = GetDriver(assignment.BrowserName);
            RenderHtml(assignment.Html, driver);

            IWebElement target = driver.FindElement(By.Id("target"));
            IWebElement root = driver.FindElement(By.Id("root"));
            Assert.That(assignment.Semantic == BySemanticLocator.PreciseLocatorFor(target, root));
        }

        [Test]
        [TestCaseSource(nameof(TestBase.PreciseLocatorForWithoutRootTests))]
        public void ClosestPreciseLocatorFor_GeneratesLocatorForElement(TestAssignment assignment)
        {
            IWebDriver driver = GetDriver(assignment.BrowserName);
            RenderHtml(assignment.Html, driver);

            IWebElement target = driver.FindElement(By.Id("target"));
            Assert.That(assignment.Semantic == BySemanticLocator.ClosestPreciseLocatorFor(target));
        }

        [Test]
        [TestCaseSource(nameof(TestBase.ClosestPreciseLocatorForWithRootTests))]
        public void ClosestPreciseLocatorFor_AcceptsRootEl(TestAssignment assignment)
        {
            IWebDriver driver = GetDriver(assignment.BrowserName);
            RenderHtml(assignment.Html, driver);

            IWebElement target = driver.FindElement(By.Id("target"));
            IWebElement root = driver.FindElement(By.Id("root"));
            Assert.That(assignment.Semantic == BySemanticLocator.ClosestPreciseLocatorFor(target, root));
        }

        [Test]
        [TestCaseSource(nameof(TestBase.ClosestSimpleLocatorForWithoutRootTests))]
        public void ClosestSimpleLocatorFor_GeneratesSimpleLocators(TestAssignment assignment)
        {
            IWebDriver driver = GetDriver(assignment.BrowserName);
            RenderHtml(assignment.Html, driver);

            IWebElement target = driver.FindElement(By.Id("target"));
            Assert.That(assignment.Semantic == BySemanticLocator.ClosestSimpleLocatorFor(target));
        }

        [Test]
        [TestCaseSource(nameof(TestBase.ClosestSimpleLocatorForWithRootTests))]
        public void ClosestSimpleLocatorFor_AcceptsRootEl(TestAssignment assignment)
        {
            IWebDriver driver = GetDriver(assignment.BrowserName);
            RenderHtml(assignment.Html, driver);

            IWebElement target = driver.FindElement(By.Id("target"));
            IWebElement root = driver.FindElement(By.Id("root"));
            Assert.That(assignment.Semantic == BySemanticLocator.ClosestSimpleLocatorFor(target, root));
        }

        [Test]
        [TestCaseSource(nameof(TestBase.SimpleLocatorForTests))]
        public void SimpleLocatorFor_GeneratesSimpleLocators(TestAssignment assignment)
        {
            IWebDriver driver = GetDriver(assignment.BrowserName);
            RenderHtml(assignment.Html, driver);

            IWebElement target = driver.FindElement(By.Id("target"));
            Assert.That(assignment.Semantic == BySemanticLocator.SimpleLocatorFor(target));
        }
    }
}