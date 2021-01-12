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

import {html, render} from 'lit-html';
import {outerNodesOnly} from '../../src/lib/outer';

describe('outerNodesOnly', () => {
  let container: HTMLElement;

  let first: HTMLElement;
  let second: HTMLElement;
  let secondFirst: HTMLElement;
  let secondFirstFirst: HTMLElement;
  let third: HTMLElement;
  let thirdFirst: HTMLElement;
  let thirdFirstFirst: HTMLElement;

  beforeAll(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    render(
        html`
    <div id="first"></div>
    <div id="second">
      <div id="second-first">
        <div id="second-first-first"></div>
      </div>
    </div>
    <div id="third">
      <div id="third-first">
        <div id="third-first-first"></div>
      </div>
    </div>`,
        container);
    first = document.getElementById('first')!;
    second = document.getElementById('second')!;
    secondFirst = document.getElementById('second-first')!;
    secondFirstFirst = document.getElementById('second-first-first')!;
    third = document.getElementById('third')!;
    thirdFirst = document.getElementById('third-first')!;
    thirdFirstFirst = document.getElementById('third-first-first')!;
  });

  afterAll(() => {
    document.body.removeChild(container);
  });


  it('removes inner nodes', () => {
    expect(outerNodesOnly([
      first, second, secondFirst, secondFirstFirst, third, thirdFirst,
      thirdFirstFirst
    ])).toEqual([first, second, third]);
    expect(outerNodesOnly([
      first, secondFirst, secondFirstFirst, thirdFirst, thirdFirstFirst
    ])).toEqual([first, secondFirst, thirdFirst]);
  });

  it('removes repeated nodes', () => {
    expect(outerNodesOnly([first, first, first])).toEqual([first]);
  });

  it('preserves an array of only outer nodes', () => {
    expect(outerNodesOnly([first, second, third])).toEqual([
      first, second, third
    ]);
  });
});
