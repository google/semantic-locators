/**
 * @license
 * Copyright 2021 The Semantic Locators Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import {html, render} from 'lit';

import {closestPreciseLocatorFor, closestSimpleLocatorFor, preciseLocatorFor, simpleLocatorFor, TEST_ONLY} from '../../src/lib/locator_gen';

const {batch} = TEST_ONLY;

let container: HTMLElement;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
});

afterEach(() => {
  document.body.removeChild(container);
});

describe('simpleLocatorFor', () => {
  it('finds roles', () => {
    render(html`<div role="button" id="foo"></div>`, container);

    expect(simpleLocatorFor(document.getElementById('foo')!))
        .toEqual('{button}');
  });

  it('finds accessible names', () => {
    render(html`<div role="button" id="foo" aria-label="OK"></div>`, container);

    expect(simpleLocatorFor(document.getElementById('foo')!))
        .toEqual(`{button 'OK'}`);
  });

  it('uses the specified quoteChar', () => {
    render(
        html`
        <div role="button" id="foo" aria-label="OK"></div>
        <div role="button" id="bar" aria-label="O'K"></div>`,
        container);

    expect(simpleLocatorFor(document.getElementById('foo')!, '"'))
        .toEqual(`{button "OK"}`);
    expect(simpleLocatorFor(document.getElementById('bar')!, `'`))
        .toEqual(`{button 'O\\'K'}`);
  });

  it('returns null if no semantic locator exists', () => {
    render(
        html`<button><div id="foo" aria-label="OK"></div></button>`, container);

    expect(simpleLocatorFor(document.getElementById('foo')!)).toEqual(null);
  });

  it('returns null for hidden elements', () => {
    render(
        html`<button id="foo" aria-label="OK" aria-hidden="true"></button>`,
        container);

    expect(simpleLocatorFor(document.getElementById('foo')!)).toEqual(null);
  });

  it('returns null for role=presentation or role=none', () => {
    render(
        html`
        <button aria-label="OK" role="presentation" id="foo"></button>
        <button aria-label="OK" role="none" id="bar"></button>
          `,
        container);

    expect(simpleLocatorFor(document.getElementById('foo')!)).toEqual(null);
    expect(simpleLocatorFor(document.getElementById('bar')!)).toEqual(null);
  });
});

describe('closestSimpleLocatorFor', () => {
  it('returns the locator for the closest semantic ancestor', () => {
    render(
        html`<div role="list"><div role="listitem"><div id="foo"></div></div></div>`,
        container);

    expect(closestSimpleLocatorFor(document.getElementById('foo')!))
        .toEqual('{listitem}');
  });

  it('returns null if no semantic locator exists', () => {
    render(
        html`<div><div><div id="foo" aria-label="OK"></div></div></div>`,
        container);

    expect(closestSimpleLocatorFor(document.getElementById('foo')!))
        .toEqual(null);
  });
});

describe('preciseLocatorFor', () => {
  it('returns null if no semantic locator exists', () => {
    render(
        html`<div><div><div id="foo" aria-label="OK"></div></div></div>`,
        container);

    expect(preciseLocatorFor(document.getElementById('foo')!)).toEqual(null);
  });

  it(`doesn't indlude redundant nodes`, () => {
    render(
        html`
            <ul><li><button id="foo">OK</button></li></ul>
            <div role="list" id="list">
              <div role="listitem" id="listitem">
                <div role="button" id="button-in-list">One button</div>
              </div>
            </div>
            <div role="button">One button</div>
          `,
        container);

    expect(preciseLocatorFor(document.getElementById('foo')!))
        .toEqual(`{button 'OK'}`);
    expect(preciseLocatorFor(document.getElementById('listitem')!))
        .toEqual(`{listitem}`);
    expect(preciseLocatorFor(document.getElementById('button-in-list')!))
        .toEqual(`{listitem} {button 'One button'}`);
  });

  it('adds more nodes if a single node is ambiguous', () => {
    render(
        html`
            <button>OK</button>
            <ul><li><button id="foo">OK</button></li></ul>
          `,
        container);

    expect(preciseLocatorFor(document.getElementById('foo')!))
        .toEqual(`{listitem} {button 'OK'}`);
  });

  it('adds "outer" if a locator is ambiguous', () => {
    render(
        html`
          <ul><li id="foo"><ul><li>blah</li></ul></li></ul>
        `,
        container);

    expect(preciseLocatorFor(document.getElementById('foo')!))
        .toEqual('outer {listitem}');
  });

  it(`doesn't add non-leaf semantic nodes with presentational children`, () => {
    render(
        html`
          <div role="button" aria-label="outer">
            <div role="button" aria-label="OK" id="foo">blah</div>
          </div>
          <div role="button" aria-label="OK">blah</div>
        `,
        container);

    expect(preciseLocatorFor(document.getElementById('foo')!)).toBeNull();
  });

  it(`produces a precise locator when intermediate nodes add no precision`,
     () => {
       render(
           html`
            <button>OK</button>
            <ul><div role="region"><li><button id="foo">OK</button></li></div></ul>
            <ul><li><button>OK</button></li></ul>
          `,
           container);

       // Testing we don't return {region} {listitem} {button 'OK'}
       expect(preciseLocatorFor(document.getElementById('foo')!))
           .toEqual(`{region} {button 'OK'}`);
     });
});

describe('closestPreciseLocatorFor', () => {
  it('returns the locator for the closest semantic ancestor', () => {
    render(
        html`
          <div role="region"><div role="button"><div id="foo"></div></div></div>
          <div role="button">blah</div>
        `,
        container);

    expect(closestPreciseLocatorFor(document.getElementById('foo')!))
        .toEqual('{region} {button}');
  });

  it('returns null if no semantic locator exists', () => {
    render(
        html`<div><div><div id="foo" aria-label="OK"></div></div></div>`,
        container);

    expect(closestPreciseLocatorFor(document.getElementById('foo')!))
        .toEqual(null);
  });

  it('returns a semantic locator within an iframe without crashing',
     async () => {
       render(html`<iframe srcdoc="<body></body>"></iframe>`, container);
       const iframe = container.querySelector('iframe')!;
       await iframeLoadedPromise(iframe);
       const iframeDocument = iframe.contentWindow!.document;
       render(html`<button>Inside iframe</button>`, iframeDocument.body);
       const button = iframeDocument.querySelector('button')!;

       expect(preciseLocatorFor(button)).toEqual(`{button 'Inside iframe'}`);
     });

  it(`returns the locator for an ancestor if the element is a presentational child`,
     () => {
       render(
           html`
          <div role="button" aria-label="outer">
            <div role="button" aria-label="OK" id="foo">blah</div>
          </div>
        `,
           container);

       expect(closestPreciseLocatorFor(document.getElementById('foo')!))
           .toEqual(`{button 'outer'}`);
     });

  it(`returns locators which are precise within a root`, () => {
    render(
        html`
        <div id="root">
          <div role="region">
            <div role="tab" id="tab">foo</div>
          </div>
        </div>
        <div role="tab">
          <div>foo</div>
        </div>
        `,
        container);

    expect(closestPreciseLocatorFor(document.getElementById('tab')!))
        .toEqual(`{region} {tab 'foo'}`);
    expect(closestPreciseLocatorFor(document.getElementById('tab')!, {
      rootEl: document.getElementById('root')!
    })).toEqual(`{tab 'foo'}`);
  });
});

describe('batch', () => {
  it('times out after configured time', () => {
    render(
        html`
        <div id="one"></div>
        <div id="two"></div>
        <div id="three"></div>
        <div id="four"></div>
        <div id="five"></div>
        <div id="six"></div>
        `,
        container);

    const batchWait1s = batch(() => {
      const t0 = Date.now();
      while (Date.now() - t0 < 1000) {
      }
      return '';
    });

    // 1.5s is enough time to start 2 computations
    const result = batchWait1s(
        new Set(container.getElementsByTagName('div')), {timeoutSeconds: 1.5});

    for (const expectedKey of ['one', 'two']) {
      expect(result.has(document.getElementById(expectedKey)!)).toBeTrue();
    }
    for (const unexpectedKey of ['three', 'four', 'five', 'six']) {
      expect(result.has(document.getElementById(unexpectedKey)!)).toBeFalse();
    }
  });
});

async function iframeLoadedPromise(iframe: HTMLIFrameElement) {
  return new Promise((resolve) => {
    iframe.addEventListener('load', resolve, {once: true});
  });
}
