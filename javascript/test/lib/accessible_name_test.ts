/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
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

  it('matches with leading and trailing wildcard', () => {
    expect(nameMatches('*foo*', 'foo')).toBeTrue();
    expect(nameMatches('*foo*', 'this string has "foo" in the middle'))
        .toBeTrue();
  });

  it('doesn\'t match with leading and trailing wildcard if actual doesn\'t contain expected',
     () => {
       expect(nameMatches('foo', 'fo oo of fo0')).toBeFalse();
     });

  it('throws for a name of *', () => {
    expect(() => nameMatches('*', '')).toThrow();
  });
});
