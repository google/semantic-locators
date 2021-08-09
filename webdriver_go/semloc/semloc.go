// Package semloc provides facilities for locating web elements using semantic
// locators. See http://github.com/google/semantic-locators#readme for more
// info.
//
// Copyright 2021 The Semantic Locators Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
package semloc

import (
	// Enable go:embed
	_ "embed"
	"errors"
	"fmt"
	"strings"

	"github.com/tebeka/selenium"
)

//go:embed wrapper_bin.js
var jsImplementation string

func installJS(wd selenium.WebDriver) error {
	installedRaw, err := wd.ExecuteScript("return window.semanticLocatorsReady === true;", nil)
	if err != nil {
		return fmt.Errorf("wd.ExecuteScript(isInstalled): %w", err)
	}
	installed, ok := installedRaw.(bool)
	if !ok {
		return fmt.Errorf("expected isInstalled script to return a bool, but got %T", installedRaw)
	}
	if installed {
		return nil
	}

	_, err = wd.ExecuteScript(jsImplementation, nil)
	return err
}

// interpretError takes in an error resulting from executing the semantic
// locator javascript and re-interprets them.
// In selenium, all errors resulting from running a javascript script have the
// "javascript error" error code. However, it makes more sense for errors thrown
// when there is no matching element to have the same "no such element" error
// code that is returned by selenium.WebDriver.FindElement when it cannot find
// an element. The same is performed for errors due to invalid locators.
// See third_party/semantic_locators/javascript/lib/error.ts for semantic
// locator javascript error message values. See
// https://w3c.github.io/webdriver/#errors for webdriver error message values.
func interpretError(err error) error {
	var serr *selenium.Error
	if !errors.As(err, &serr) {
		return err
	}
	if serr.Err != "javascript error" {
		return err
	}

	// Error messages are in the format
	// "javascript error: <error name>: <human readable message>"
	// we want to switch on the 2nd part (error name)
	parts := strings.SplitN(serr.Message, ":", 3)
	if len(parts) != 3 {
		return err
	}
	errName := strings.TrimSpace(parts[1])

	switch errName {
	case "NoSuchElementError":
		return &selenium.Error{
			Err:        "no such element",
			Message:    serr.Message,
			Stacktrace: serr.Stacktrace,
			HTTPCode:   404,
			LegacyCode: serr.LegacyCode,
		}
	case "InvalidLocatorError":
		return &selenium.Error{
			Err:        "invalid selector",
			Message:    serr.Message,
			Stacktrace: serr.Stacktrace,
			HTTPCode:   400,
			LegacyCode: serr.LegacyCode,
		}
	default:
		return err
	}
}

// FindElement returns the first WebElement located by the given semantic
// locator. If 'context' is non-nil, only elements that are descendants of
// 'context' are considered.
func FindElement(wd selenium.WebDriver, locator string, context selenium.WebElement) (selenium.WebElement, error) {
	if err := installJS(wd); err != nil {
		return nil, fmt.Errorf("installJS: %w", err)
	}

	args := []interface{}{locator}
	if context != nil {
		args = append(args, context)
	}

	elmRaw, err := wd.ExecuteScriptRaw("return window.findElementBySemanticLocator.apply(null, arguments)", args)
	err = interpretError(err)
	if err != nil {
		return nil, fmt.Errorf("wd.ExecuteScriptRaw(window.findElementBySemanticLocator): %w", err)
	}

	return wd.DecodeElement(elmRaw)
}

// FindElements returns all the WebElements located by the given semantic
// locator.  If 'context' is non-nil, only elements that are descendants of
// 'context' are included.
func FindElements(wd selenium.WebDriver, locator string, context selenium.WebElement) ([]selenium.WebElement, error) {
	if err := installJS(wd); err != nil {
		return nil, fmt.Errorf("installJS: %w", err)
	}

	args := []interface{}{locator}
	if context != nil {
		args = append(args, context)
	}

	elmsRaw, err := wd.ExecuteScriptRaw("return window.findElementsBySemanticLocator.apply(null, arguments)", args)
	err = interpretError(err)
	if err != nil {
		return nil, fmt.Errorf("wd.ExecuteScriptRaw(window.findElementsBySemanticLocator): %w", err)
	}

	return wd.DecodeElements(elmsRaw)
}
