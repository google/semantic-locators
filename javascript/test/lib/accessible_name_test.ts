/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {nameMatches} from '../../src/lib/accessible_name';

describe('nameMatches', () => {
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
});
