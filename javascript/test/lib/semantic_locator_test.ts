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

import {SemanticLocator, SemanticNode} from '../../src/lib/semantic_locator';

// TODO(alexlloyd) test that `parse(locator.toString()) === locator`

describe('SemanticNode.toString', () => {
  it('returns a valid locator if only a role is specified', () => {
    expect(new SemanticNode('button', []).toString()).toEqual('{button}');
  });

  it('returns a valid locator if name is specified', () => {
    expect(new SemanticNode('button', [], 'OK').toString())
        .toEqual(`{button 'OK'}`);
  });

  it('returns a valid locator if attributes are specified', () => {
    expect(new SemanticNode(
               'button',
               [
                 {name: 'checked', value: 'false'},
                 {name: 'disabled', value: 'true'},
               ])
               .toString())
        .toEqual('{button checked:false disabled:true}');
  });

  it('returns a valid locator if name and attributes are specified', () => {
    expect(new SemanticNode(
               'button',
               [
                 {name: 'checked', value: 'false'},
                 {name: 'disabled', value: 'true'},
               ],
               'OK',
               )
               .toString())
        .toEqual(`{button 'OK' checked:false disabled:true}`);
  });

  it('returns a double quoted locator if name contains single quotes', () => {
    expect(new SemanticNode('button', [], `What's new?`).toString())
        .toEqual(`{button "What's new?"}`);
  });

  it('returns a single quoted locator if name contains double quotes', () => {
    expect(new SemanticNode('button', [], '"Coming up"').toString())
        .toEqual(`{button '"Coming up"'}`);
  });

  it('returns a single quoted locator with escaped quotes if name contains single and double quotes',
     () => {
       expect(new SemanticNode('button', [], `"What's new?"`).toString())
           .toEqual(`{button '"What\\'s new?"'}`);
     });
});

describe('SemanticLocator', () => {
  describe('constructor', () => {
    it('throws an error if a role with presentational children is in a non=final SemanticNode',
       () => {
         expect(
             () => new SemanticLocator(
                 [new SemanticNode('button', [])],
                 [new SemanticNode('list', [])]))
             .toThrowError(/The role "button" has presentational children./);
       });
  });

  describe('toString', () => {
    it('returns a valid locator for a single preOuter SemanticNode', () => {
      expect(new SemanticLocator(
                 [new SemanticNode(
                     'button',
                     [
                       {name: 'checked', value: 'false'},
                       {name: 'disabled', value: 'true'},
                     ],
                     'OK',
                     )],
                 [])
                 .toString())
          .toEqual(`{button 'OK' checked:false disabled:true}`);
    });

    it('returns a valid locator for multiple preOuter SemanticNodes', () => {
      expect(new SemanticLocator(
                 [
                   new SemanticNode('list', [], 'My calendars'),
                   new SemanticNode(
                       'button',
                       [
                         {name: 'checked', value: 'false'},
                         {name: 'disabled', value: 'true'},
                       ],
                       'OK',
                       )
                 ],
                 [])
                 .toString())
          .toEqual(
              `{list 'My calendars'} {button 'OK' checked:false disabled:true}`);
    });

    it('returns a valid locator for multiple postOuter SemanticNodes', () => {
      expect(new SemanticLocator(
                 [],
                 [
                   new SemanticNode('list', [], 'My calendars'),
                   new SemanticNode(
                       'button',
                       [
                         {name: 'checked', value: 'false'},
                         {name: 'disabled', value: 'true'},
                       ],
                       'OK',
                       )
                 ])
                 .toString())
          .toEqual(
              `outer {list 'My calendars'} {button 'OK' checked:false disabled:true}`);
    });

    it('returns a valid locator for both preOuter and postOuter SemanticNodes',
       () => {
         expect(new SemanticLocator(
                    [
                      new SemanticNode('list', [], 'My calendars'),
                    ],
                    [
                      new SemanticNode(
                          'button',
                          [
                            {name: 'checked', value: 'false'},
                            {name: 'disabled', value: 'true'},
                          ],
                          'OK',
                          ),
                    ])
                    .toString())
             .toEqual(
                 `{list 'My calendars'} outer {button 'OK' checked:false disabled:true}`);
       });
  });
});
