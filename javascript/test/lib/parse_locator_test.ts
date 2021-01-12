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

import {parse} from '../../src/lib/parse_locator';
import {SemanticLocator, SemanticNode} from '../../src/lib/semantic_locator';

describe('parser', () => {
  it('should allow a role without a name', () => {
    expect(parse('{button}'))
        .toEqual(new SemanticLocator([new SemanticNode('button', [])], []));
  });
  it('should fail to parse if role is invalid', () => {
    expect(() => parse('{foo}')).toThrowError(/Unknown role: foo/);
  });
  it('should allow double quotes', () => {
    expect(parse('{button "OK"}'))
        .toEqual(
            new SemanticLocator([new SemanticNode('button', [], 'OK')], []));
  });
  it('should allow single qutoes within a double quoted string', () => {
    expect(parse(`{button "I'm OK"}`))
        .toEqual(new SemanticLocator(
            [new SemanticNode('button', [], `I'm OK`)], []));
  });
  it('should allow escaped double quotes within a double quoted string', () => {
    expect(parse('{button "\\"OK\\""}'))
        .toEqual(
            new SemanticLocator([new SemanticNode('button', [], '"OK"')], []));
  });
  it('should allow single quotes', () => {
    expect(parse(`{button 'OK'}`))
        .toEqual(
            new SemanticLocator([new SemanticNode('button', [], 'OK')], []));
  });
  it('should allow escaped single qutoes within a single quoted string', () => {
    expect(parse(`{button 'I\\'m OK'}`))
        .toEqual(new SemanticLocator(
            [new SemanticNode('button', [], `I'm OK`)], []));
  });
  it('should allow double quotes within a single quoted string', () => {
    expect(parse(`{button '"OK"'}`))
        .toEqual(
            new SemanticLocator([new SemanticNode('button', [], '"OK"')], []));
  });
  it('should fail to parse if quotes are missing', () => {
    expect(() => parse('{button OK}')).toThrow();
  });
  it('should fail to parse if quotes are unclosed', () => {
    expect(() => parse('{button "OK}')).toThrow();
  });
  it('should allow multiple semantic nodes', () => {
    expect(parse(`{button} {list 'foo'} {listitem}`))
        .toEqual(new SemanticLocator(
            [
              new SemanticNode('button', []),
              new SemanticNode('list', [], 'foo'),
              new SemanticNode('listitem', []),
            ],
            []));
  });
  it('should allow outer at the start', () => {
    expect(parse('outer {button}'))
        .toEqual(new SemanticLocator([], [new SemanticNode('button', [])]));
  });
  it('should allow outer in the middle', () => {
    expect(parse('{list} outer {listitem}'))
        .toEqual(new SemanticLocator(
            [new SemanticNode('list', [])],
            [new SemanticNode('listitem', [])],
            ));
  });
  it('should not allow outer at the end', () => {
    expect(() => parse('{list} {listitem} outer '))
        .toThrowError(
            'Failed to parse semantic locator "{list} {listitem} outer ". ' +
            'Error message: Expected "{" but end of input found.');
  });
  it('should allow attributes', () => {
    expect(
        parse(
            '{list "name" disabled:true selected:false checked:mixed} {listitem readonly:true}'))
        .toEqual(new SemanticLocator(
            [
              new SemanticNode(
                  'list',
                  [
                    {name: 'disabled' as const, value: 'true'},
                    {name: 'selected' as const, value: 'false'},
                    {name: 'checked' as const, value: 'mixed'},
                  ],
                  'name'),
              new SemanticNode(
                  'listitem',
                  [
                    {name: 'readonly' as const, value: 'true'},
                  ])
            ],
            []));
  });
  it('should fail to parse if attribute is unsupported', () => {
    expect(() => parse('{list foo:bar}'))
        .toThrowError(/Unsupported attribute: foo/);
  });
  it('should fail to parse an empty locator', () => {
    expect(() => parse('')).toThrowError('Locator is empty');
  });
  it('should fail to parse if braces aren\'t closed', () => {
    expect(() => parse('{button "OK"'))
        .toThrowError(
            'Failed to parse semantic locator "{button "OK"". ' +
            'Error message: Expected "}" or [a-z] but end of input found.');
  });
});
