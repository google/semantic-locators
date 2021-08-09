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
	"errors"
	"testing"

	"github.com/tebeka/selenium"
)

func newWebdriver(t *testing.T) selenium.WebDriver {
	t.Fatalf("not yet implemented") // TODO: implement
	return nil
}

func setup(t *testing.T) selenium.WebDriver {
	wd := newWebdriver(t)
	t.Cleanup(func() {
		wd.Quit()
	})

	return wd
}

func renderHTML(t *testing.T, wd selenium.WebDriver, html string) {
	if err := wd.Get("data:text/html;charset=utf-8," + html); err != nil {
		t.Fatalf("wd.Get: %v", err)
	}
}

func TestFindElements_FindsElements(t *testing.T) {
	wd := setup(t)

	tests := []struct {
		desc    string
		locator string
		html    string
	}{
		{
			desc:    "single quotes",
			locator: "{button 'OK'}",
			html:    "<button id='target'>OK</button>",
		},
		{
			desc:    "double quotes",
			locator: "{button \"OK\"}",
			html:    "<button id='target'>OK</button>",
		},
		{
			desc:    "nested elements",
			locator: "{list} {listitem}",
			html:    "<ul><li id='target'>foo</li></ul>",
		},
		{
			desc:    "wildcard at start",
			locator: "{button '*and_end'}",
			html:    "<button id='target'>beginning_and_end</button>",
		},
		{
			desc:    "wildcard at end",
			locator: "{button 'beginning_and*'}",
			html:    "<button id='target'>beginning_and_end</button>",
		},
		{
			desc:    "wildcard at start and end",
			locator: "{button '*and*'}",
			html:    "<button id='target'>beginning_and_end</button>",
		},
		{
			desc:    "outer list",
			locator: "{region} outer {list}",
			html:    "<div role='region'><ul id='target'><li><ul><li>foo</li></ul></li></ul></div>",
		},
		{
			desc:    "unicode and control characters",
			locator: "{button 'блČλñéç‪हिन्दी‬日本語‬‪한국어‬й‪ไ🤖-—–;|<>!\"_+'}",
			html:    "<button id='target' aria-label='блČλñéç‪हिन्दी‬日本語‬‪한국어‬й‪ไ🤖-—–;|<>!&quot;_+'>OK</button>",
		},
		{
			desc:    "escaped quotes",
			locator: "{ button '\\'escaped quotes\\\\\\' and unescaped\\\\\\\\'}",
			html:    "<button id='target'>'escaped quotes\\' and unescaped\\\\</button>",
		},
	}

	for _, test := range tests {
		t.Run(test.desc, func(t *testing.T) {
			renderHTML(t, wd, test.html)
			elm, err := FindElement(wd, test.locator, nil)
			if err != nil {
				t.Fatalf("semloc.FindElement: %v", err)
			}
			id, err := elm.GetAttribute("id")
			if err != nil {
				t.Fatalf("elm.GetAttribute: %v", err)
			}
			if id != "target" {
				t.Errorf("wrong element selected, wanted element with id 'target'")
			}
		})
	}
}

func TestFindElements_FindsDuplicates(t *testing.T) {
	wd := setup(t)
	renderHTML(t, wd, "<button>OK</button><button aria-label='OK'>foo</button><div role='button'>OK</div>")

	elms, err := FindElements(wd, "{button 'OK'}", nil)
	if err != nil {
		t.Fatalf("FindElements: %v", err)
	}
	if len(elms) != 3 {
		t.Errorf("semloc.FindElements returned %d elements, but wanted 3", len(elms))
	}
}

func TestFindWithContext(t *testing.T) {
	wd := setup(t)
	renderHTML(t, wd, "<button>OK</button><div id='container'><button id='target'>OK</button></div>")

	container, err := wd.FindElement(selenium.ByID, "container")
	if err != nil {
		t.Fatalf("FindElement(#container): %v", err)
	}

	elm, err := FindElement(wd, "{button 'OK'}", container)
	if err != nil {
		t.Fatalf("semloc.FindElements: %v", err)
	}
	id, err := elm.GetAttribute("id")
	if err != nil {
		t.Fatalf("elm.GetAttribute: %v", err)
	}
	if id != "target" {
		t.Errorf("wrong element selected, wanted element with id 'target'")
	}

	elms, err := FindElements(wd, "{button 'OK'}", container)
	if err != nil {
		t.Fatalf("semloc.FindElements: %v", err)
	}
	if len(elms) != 1 {
		t.Fatalf("semloc.FindElements returned %d elements, but expected 1", len(elms))
	}
	id, err = elms[0].GetAttribute("id")
	if err != nil {
		t.Fatalf("elm.GetAttribute: %v", err)
	}
	if id != "target" {
		t.Errorf("wrong element selected, wanted element with id 'target'")
	}
}

func TestInvalidSyntax(t *testing.T) {
	wd := setup(t)
	renderHTML(t, wd, "<button>OK</button><div id='container'><button id='target'>OK</button></div>")

	tests := []struct {
		desc    string
		locator string
	}{
		{"unterminated", "{button 'OK'"},
		{"bad escaping", "{button 'OK\\'}"},
	}

	for _, test := range tests {
		t.Run(test.desc, func(t *testing.T) {
			_, err := FindElement(wd, test.locator, nil)
			if got, want := getErrMsg(t, err), "invalid selector"; got != want {
				t.Errorf("err returned by FindElement had message %q, but wanted %q", got, want)
			}

			_, err = FindElements(wd, test.locator, nil)
			if got, want := getErrMsg(t, err), "invalid selector"; got != want {
				t.Errorf("err returned by FindElements had message %q, but wanted %q", got, want)
			}
		})
	}
}

func TestNoSuchElement(t *testing.T) {
	wd := setup(t)
	_, err := FindElement(wd, "{button 'this label does not exist'}", nil)
	if got, want := getErrMsg(t, err), "no such element"; got != want {
		t.Errorf("err returned by FindElements had message %q, but wanted %q", got, want)
	}
}

func getErrMsg(t *testing.T, err error) string {
	if err == nil {
		return ""
	}
	var serr *selenium.Error
	if !errors.As(err, &serr) {
		t.Errorf("expected error to be a selenium.Error, but was %#v", err)
	}
	return serr.Err
}
