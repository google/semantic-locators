/**
 * @license
 * Copyright 2021 The Semantic Locators Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import {html, render} from 'lit-html';

import {closestPreciseLocatorFor, closestSimpleLocatorFor, preciseLocatorFor, simpleLocatorFor} from '../../src/lib/locator_gen';


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
          `,
        container);

    expect(preciseLocatorFor(document.getElementById('foo')!))
        .toEqual(`{button 'OK'}`);
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
    expect(closestPreciseLocatorFor(
               document.getElementById('tab')!, document.getElementById('root')!
               ))
        .toEqual(`{tab 'foo'}`);
  });
});

async function iframeLoadedPromise(iframe: HTMLIFrameElement) {
  return new Promise((resolve) => {
    iframe.addEventListener('load', resolve, {once: true});
  });
}
