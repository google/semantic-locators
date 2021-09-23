/**
 * @license
 * Copyright 2021 The Semantic Locators Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import {html, render} from 'lit';

import {getNameFor, nameMatches} from '../../src/lib/accessible_name';
import {runBatchOp} from '../../src/lib/batch_cache';

describe('nameMatches', () => {
  let container: HTMLElement;
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('mathes the same string without wildcards', () => {
    expect(nameMatches('foo', 'foo')).toBeTrue();
    expect(nameMatches('', '')).toBeTrue();
  });

  it('doesn\'t match different strings without wildcards', () => {
    expect(nameMatches('foo', 'foo bar')).toBeFalse();
  });

  it('matches with leading wildcard if actual ends with expected', () => {
    expect(nameMatches('*foo', 'foo')).toBeTrue();
    expect(nameMatches('*foo', 'this string end with foo')).toBeTrue();
  });

  it('doesn\'t match with leading wildcard if actual doesn\'t end with expected',
     () => {
       expect(nameMatches('*foo', 'foo bar')).toBeFalse();
     });

  it('matches with trailing wildcard', () => {
    expect(nameMatches('foo*', 'foo')).toBeTrue();
    expect(nameMatches('foo*', 'foo is at the start of this string'))
        .toBeTrue();
  });

  it('doesn\'t match with trailing wildcard if actual doesn\'t start with expected',
     () => {
       expect(nameMatches('foo*', 'bar foo')).toBeFalse();
     });

  it('matches with wildcard in the middle', () => {
    expect(nameMatches('foo*baz', 'foobarbaz')).toBeTrue();
    expect(nameMatches('foo*baz', 'foobaz')).toBeTrue();
    expect(nameMatches('foo*baz', 'fooaz')).toBeFalse();
  });


  it('matches with wildcards everywhere', () => {
    expect(nameMatches('I am * Bat*', 'I am not Batman')).toBeTrue();
    expect(nameMatches('I am * Bat*', 'I am a Bat')).toBeTrue();
    expect(nameMatches('I am * Bat*', 'I am Bat')).toBeFalse();
  });

  it('doesn\'t match with leading and trailing wildcard if actual doesn\'t contain expected',
     () => {
       expect(nameMatches('foo', 'fo oo of fo0')).toBeFalse();
     });

  it('throws for a name of *', () => {
    expect(() => nameMatches('*', '')).toThrow();
  });

  it('caches values if cache is enabled', () => {
    render(html`<div role="button" id="button">original name</div>`, container);
    const button = document.getElementById('button')!;
    runBatchOp(() => {
      // Seed cache
      getNameFor(button);
      button.innerText = 'new name';

      expect(getNameFor(button)).toBe('original name');
    });
    expect(getNameFor(button)).toBe('new name');
  });

  it('clears cache between runBatchOp calls', () => {
    render(html`<div role="button" id="button">original name</div>`, container);
    const button = document.getElementById('button')!;
    runBatchOp(() => {
      getNameFor(button);
      button.innerText = 'new name';

      expect(getNameFor(button)).toBe('original name');
    });
    runBatchOp(() => {
      expect(getNameFor(button)).toBe('new name');
    });
  });
});
