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
using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.Firefox;
using OpenQA.Selenium.Remote;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SemanticLocators.Tests
{
    public class TestBase
    {
        // Use a string to identify browsers so the test names are readable
        private static ConcurrentDictionary<string, IWebDriver> Drivers = new ConcurrentDictionary<string, IWebDriver>();
        private static string[] _supportedBrowsers = new[] { "chrome", "firefox" };

        [OneTimeTearDown]
        public void OneTimeTearDown()
        {
            foreach (var driver in Drivers)
                driver.Value.Quit();
        }

        protected void RenderHtml(string html, IWebDriver driver)
        {
            string browserName;
            if(driver is RemoteWebDriver)
                browserName = (string)((RemoteWebDriver)driver).Capabilities.GetCapability("browserName");
            else
                browserName = (string)((WebDriver)driver).Capabilities.GetCapability("browserName");

            // IE doesn't support data URLs
            if (browserName.Equals("internet explorer"))
            {
                driver.Navigate().GoToUrl("about:blank");
                ((IJavaScriptExecutor)driver)
                    .ExecuteScript(
                        "document.write(\""
                         + html.Replace("\\", "\\\\") // Extra escape for the JS string
                         + "\")");

            }
            else
            {
                driver.Navigate().GoToUrl("data:text/html;charset=utf-8," + html);
            }
        }

        protected static IWebDriver GetDriver(string driverName)
        {
            if (Drivers.ContainsKey(driverName))
                return Drivers[driverName];

            var chromeOptions = new ChromeOptions();
            chromeOptions.AddArguments("--headless");

            var firefoxOptions = new FirefoxOptions();
            firefoxOptions.AddArguments("--headless");

            IWebDriver driver = driverName switch
            {
                "chrome" => new ChromeDriver(chromeOptions),
                "firefox" => new FirefoxDriver(firefoxOptions),
                _ => throw new ArgumentException("Must provide a supported driver type!"),
            };

            Drivers.TryAdd(driverName, driver);
            return driver;
        }

        protected static List<TestAssignment> InvalidSyntaxTests()
        {
            var list = new List<TestAssignment>();
            list.AddRange(WithAllDriverNames("{button 'OK'", ""));
            list.AddRange(WithAllDriverNames("{button 'OK\\'}", ""));
            return list;
        }


        protected static List<TestAssignment> PreciseLocatorForWithoutRootTests()
        {
            var list = new List<TestAssignment>();
            list.AddRange(WithAllDriverNames("{button 'OK'}", "<button id='target'>OK</button>"));
            list.AddRange(WithAllDriverNames("{listitem} {button 'OK'}", "<ul><li><button id='target'>OK</button></li></ul><button>OK</button>"));
            return list;
        }

        protected static List<TestAssignment> PreciseLocatorForWithRootTests()
        {
            var list = new List<TestAssignment>();
            list.AddRange(WithAllDriverNames("{button 'OK'}", "<div id='root'><button id='target'>OK</button></div>"));
            list.AddRange(WithAllDriverNames("{button 'OK'}", "<div id='root'><ul><li><button id='target'>OK</button></li></ul></div>" + "<button>OK</button>"));
            list.AddRange(WithAllDriverNames(null, "<div id='root'><button><div id='target'>OK</div></button></div>"));
            return list;
        }

        protected static List<TestAssignment> ClosestPreciseLocatorForWithoutRootTests()
        {
            var list = new List<TestAssignment>();
            list.AddRange(WithAllDriverNames("{button 'OK'}", "<button id='target'>OK</button>"));
            list.AddRange(WithAllDriverNames("{listitem} {button 'OK'}", "<ul><li><button id='target'>OK</button></li></ul><button>OK</button>"));
            list.AddRange(WithAllDriverNames("{button 'OK'}", "<button><div id='target'>OK</div></button>"));
            return list;
        }

        protected static string[] GetAllDriverNames()
        {
            return _supportedBrowsers;
        }


        protected static List<TestAssignment> WithAllDriverNames(string semantic, string html)
        {
            var list = new List<TestAssignment>();

            foreach (var browserName in GetAllDriverNames())
            {
                list.Add(new TestAssignment { BrowserName = browserName, Html = html, Semantic = semantic });
            }

            return list;
        }

        protected static List<TestAssignment> FindElementTests()
        {
            var assignments = new List<TestAssignment>();
            assignments.AddRange(WithAllDriverNames("{button 'OK'}", "<button id='target'>OK</button>"));
            assignments.AddRange(WithAllDriverNames("{button \"OK\"}", "<button id='target'>OK</button>"));
            assignments.AddRange(WithAllDriverNames("{list} {listitem}", "<ul><li id='target'>foo</li></ul>"));
            assignments.AddRange(WithAllDriverNames("{button '*and_end'}", "<button id='target'>beginning_and_end</button>"));
            assignments.AddRange(WithAllDriverNames("{button 'beginning_and*'}", "<button id='target'>beginning_and_end</button>"));
            assignments.AddRange(WithAllDriverNames("{button '*and*'}", "<button id='target'>beginning_and_end</button>"));
            assignments.AddRange(WithAllDriverNames("{region} outer {list}", "<div role='region'><ul id='target'><li><ul><li>foo</li></ul></li></ul></div>"));
            assignments.AddRange(WithAllDriverNames("{ button '\\'escaped quotes\\\\\\' and unescaped\\\\\\\\'}", "<button id='target'>'escaped quotes\\' and unescaped\\\\</button>"));
            return assignments;
        }

        protected static List<TestAssignment> ClosestPreciseLocatorForWithRootTests()
        {
            var assignments = new List<TestAssignment>();
            assignments.AddRange(WithAllDriverNames("{button 'OK'}", "<div id='root'><button id='target'>OK</button></div>"));
            assignments.AddRange(WithAllDriverNames("{button 'OK'}", "<div id='root'><ul><li><button id='target'>OK</button></li></ul></div><button>OK</button>"));
            assignments.AddRange(WithAllDriverNames("{button 'OK'}", "<div id='root'><button><div id='target'>OK</div></button></div>"));
            return assignments;
        }

        protected static List<TestAssignment> ClosestSimpleLocatorForWithoutRootTests()
        {
            var assignments = new List<TestAssignment>();
            assignments.AddRange(WithAllDriverNames("{button 'OK'}", "<button>OK</button><ul><li><button><div" + " id='target'>OK</div></button></li></ul>"));
            return assignments;
        }

        protected static List<TestAssignment> ClosestSimpleLocatorForWithRootTests()
        {
            var assignments = new List<TestAssignment>();
            assignments.AddRange(WithAllDriverNames(null, "<button>OK</button><ul><li><button id='root'><div id='target'>OK</div></button></li></ul>"));
            assignments.AddRange(WithAllDriverNames("{button 'OK'}", "<button>OK</button><ul><li id='root'><button><div id='target'>OK</div></button></li></ul>"));
            return assignments;
        }

        protected static List<TestAssignment> SimpleLocatorForTests()
        {
            var assignments = new List<TestAssignment>();
            assignments.AddRange(WithAllDriverNames("{button 'OK'}", "<button>OK</button><ul><li id='root'><button id='target'><div>OK</div></button></li></ul>"));
            assignments.AddRange(WithAllDriverNames(null, "<button>OK</button><ul><li id='root'><button><div id='target'>OK</div></button></li></ul>"));
            return assignments;
        }
    }
}
