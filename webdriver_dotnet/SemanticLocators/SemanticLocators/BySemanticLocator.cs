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
using OpenQA.Selenium;
using OpenQA.Selenium.Internal;
using OpenQA.Selenium.Remote;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Globalization;
using System.IO;

namespace SemanticLocators
{
    public class BySemanticLocator : By
    {
        private static string wrappedAtom;
        private string _semanticLocator;

        static BySemanticLocator()
        {
            string atom = string.Empty;
            using (Stream atomStream = File.OpenRead("wrapper_bin.js"))
            {
                using (StreamReader atomReader = new StreamReader(atomStream))
                {
                    atom = atomReader.ReadToEnd();
                }
            }

            wrappedAtom = atom;
        }

        public BySemanticLocator(string semanticLocator)
        {
            _semanticLocator = semanticLocator;
        }

        public override IWebElement FindElement(ISearchContext context)
        {
            return (IWebElement)CallJsFunction(GetExecutor(context), "findElementBySemanticLocator", GetArgs(_semanticLocator, context));
        }

        public override ReadOnlyCollection<IWebElement> FindElements(ISearchContext context)
        {
            object result = CallJsFunction(GetExecutor(context), "findElementsBySemanticLocator", GetArgs(_semanticLocator, context));

            //If no elements are found, a collection of object is returned
            if(result is ReadOnlyCollection<object>)
                return new ReadOnlyCollection<IWebElement>(new List<IWebElement>());

            return result as ReadOnlyCollection<IWebElement>;
        }

        private static object[] GetArgs(string semanticLocator, ISearchContext context)
        {
            return (context is IWebElement
                ? new object[] { semanticLocator, context }
                : new object[] { semanticLocator });
        }

        /**
        * Builds the most precise locator which matches `element`. If `element` does not have a role,
        * return a semantic locator which matches the closest ancestor with a role. "Precise" means that
        * it matches the fewest other elements, while being as short as possible.
        *
        * <p>Returns null if no semantic locator exists for any ancestor.
        */
        public static string ClosestPreciseLocatorFor(IWebElement element)
        {
            return (string)CallJsFunction(GetExecutor(element), "closestPreciseLocatorFor", element);
        }

        /**
         * Builds the most precise locator which matches `element`. If `element` does not have a role,
         * return a semantic locator which matches the closest ancestor with a role. "Precise" means that
         * it matches the fewest other elements, while being as short as possible.
         *
         * <p>Returns null if no semantic locator exists for any ancestor.
         */
        public static string ClosestPreciseLocatorFor(IWebElement element, IWebElement rootEl)
        {
            return (string)CallJsFunction(GetExecutor(element), "closestPreciseLocatorFor", element, rootEl);
        }

        /**
         * Builds the most precise locator which matches `element`. "Precise" means that it matches the
         * fewest other elements, while being as short as possible.
         *
         * <p>Returns null if no semantic locator exists.
         */
        public static string PreciseLocatorFor(IWebElement element)
        {
            return (string)CallJsFunction(GetExecutor(element), "preciseLocatorFor", element);
        }

        /**
         * Builds the most precise locator which matches `element`. "Precise" means that it matches the
         * fewest other elements, while being as short as possible.
         *
         * <p>Returns null if no semantic locator exists.
         */
        public static string PreciseLocatorFor(IWebElement element, IWebElement rootEl)
        {
            return (string)CallJsFunction(GetExecutor(element), "preciseLocatorFor", element, rootEl);
        }

        /**
         * Builds a semantic locator which matches `element`. If `element` does not have a role, return a
         * semantic locator which matches the closest ancestor with a role. "Simple" means it will only
         * ever specify one node, even if more nodes would be more precise. i.e. returns `{button 'OK'}`,
         * never `{listitem} {button 'OK'}`. To generate locators for tests, `closestPreciseLocatorFor` or
         * `preciseLocatorFor` are usually more suitable.
         *
         * <p>Returns null if no semantic locator exists for any ancestor.
         */
        public static string ClosestSimpleLocatorFor(IWebElement element)
        {
            return (string)CallJsFunction(GetExecutor(element), "closestSimpleLocatorFor", element);
        }

        /**
         * Builds a semantic locator which matches `element`. If `element` does not have a role, return a
         * semantic locator which matches the closest ancestor with a role. "Simple" means it will only
         * ever specify one node, even if more nodes would be more precise. i.e. returns `{button 'OK'}`,
         * never `{listitem} {button 'OK'}`. To generate locators for tests, `closestPreciseLocatorFor` or
         * `preciseLocatorFor` are usually more suitable.
         *
         * <p>Returns null if no semantic locator exists for any ancestor.
         */
        public static string ClosestSimpleLocatorFor(IWebElement element, IWebElement rootEl)
        {
            return (string)CallJsFunction(GetExecutor(element), "closestSimpleLocatorFor", element, rootEl);
        }

        /**
         * Builds a locator with only one part which matches `element`. "Simple" means it will only ever
         * specify one node, even if more nodes would be more precise. i.e. returns `{button 'OK'}`, never
         * `{listitem} {button 'OK'}`. To generate locators for tests, `closestPreciseLocatorFor` or
         * `preciseLocatorFor` are usually more suitable.
         *
         * <p>Returns null if no semantic locator exists.
         */
        public static string SimpleLocatorFor(IWebElement element)
        {
            return (string)CallJsFunction(GetExecutor(element), "simpleLocatorFor", element);
        }

        private static void LoadDefinition(IJavaScriptExecutor executor)
        {
            if ((bool)executor.ExecuteScript("return window.semanticLocatorsReady !== true;"))
            {
                executor.ExecuteScript(wrappedAtom);
            }
        }

        protected static object CallJsFunction(IJavaScriptExecutor executor, string function, params object[] args)
        {
            LoadDefinition(executor);
            string script = "return window." + function + ".apply(null, arguments);";

            try
            {
                return executor.ExecuteScript(script, args);
            }
            catch (WebDriverException e)
            {
                throw DeserializeException(e);
            }
        }

        protected static IJavaScriptExecutor GetExecutor(ISearchContext context)
        {
            if (context is IJavaScriptExecutor) 
            {
                return (IJavaScriptExecutor)context;
            } 
            else if (context is WebElement) 
            {
                return (IJavaScriptExecutor)((WebElement)context).WrappedDriver;
            } 
            else
            {
                throw new SemanticLocatorException(
                    string.Format("No IJavaScriptExecutor available from context %s", context));
            }
        }

        private static Exception DeserializeException(WebDriverException e)
        {
            // The message sent back from browsers looks something like:
            // "Error in javascript: NoSuchElementError: nothing found...."
            // Where the "Error in javascript" string varies between browsers
            string message = e.Message;
            string[] parts = message.Split(":", 3);
            if (parts.Length != 3)
            {
                return new SemanticLocatorException(
                    string.Format("Failed to find elements by semantic locators. %s", message));
            }
            switch (parts[1].Trim())
            {
                case "NoSuchElementError":
                    return new NoSuchElementException(parts[2].Trim());
                case "InvalidLocatorError":
                    return new InvalidSelectorException(parts[2].Trim());
                default:
                    return new SemanticLocatorException(
                        string.Format("Failed to find elements by semantic locators. %s:%s", parts[1], parts[2]));
            }
        }

        public override string ToString()
        {
            return "BySemanticLocator: " + _semanticLocator;
        }
    }
}
