/**
 * @license
 * Copyright 2021 The Semantic Locators Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import {html, render} from 'lit';

import {hasDataInColumn, hasDataInRow, TEST_ONLY} from '../../src/lib/table';

// ESLint can't tell that RenderedGrid is a class and I can't work out a
// configuration which allows this without being too lax
// eslint-disable-next-line @typescript-eslint/naming-convention
const {gridFromTable, RenderedGrid} = TEST_ONLY;

let container: HTMLElement;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
});

afterEach(() => {
  document.body.removeChild(container);
});

function getCell(id: string): HTMLTableCellElement {
  return document.getElementById(id)! as HTMLTableCellElement;
}

function getTable(): HTMLTableElement {
  return container.querySelector('table')!;
}

describe('hasDataInRow', () => {
  it('returns true if there is a <td> in the same row', () => {
    render(
        html`
          <table>
            <tr><th id="0,0">h</th><th id="0,1">h</th></tr>
            <tr><th id="1,0">h</th><td id="1,1">d</td></tr>
            <tr><td id="2,0">d</td><td id="2,1">d</td></tr>
          </table>
        `,
        container);
    expect(hasDataInRow(getTable(), getCell('0,0'))).toBeFalse();
    expect(hasDataInRow(getTable(), getCell('1,0'))).toBeTrue();
    expect(hasDataInRow(getTable(), getCell('2,0'))).toBeTrue();
  });

  it('takes into account rowspan on data element', () => {
    render(
        html`
          <table>
            <tr><td id="0,0" rowspan="2">d</td></tr>
            <tr><th id="1,0">h</th></tr>
          </table>
        `,
        container);
    expect(hasDataInRow(getTable(), getCell('1,0'))).toBeTrue();
  });

  it('takes into account rowspan on target element', () => {
    render(
        html`
          <table>
            <tr><th id="0,0" rowspan="2">h</th></tr>
            <tr><td id="1,0">d</td></tr>
          </table>
        `,
        container);
    expect(hasDataInRow(getTable(), getCell('1,0'))).toBeTrue();
  });
});

describe('hasDataInColumn', () => {
  it('returns true if there is a <td> in the same column', () => {
    render(
        html`
          <table>
            <tr><th id="0,0">h</th><th id="0,1">h</th><td id="0,2">d</td></tr>
            <tr><th id="1,0">h</th><td id="1,1">d</td><td id="1,2">d</td></tr>
          </table>
        `,
        container);
    expect(hasDataInColumn(getTable(), getCell('0,0'))).toBeFalse();
    expect(hasDataInColumn(getTable(), getCell('0,1'))).toBeTrue();
    expect(hasDataInColumn(getTable(), getCell('0,2'))).toBeTrue();
  });

  it('takes into account colspan on data element', () => {
    render(
        html`
          <table>
            <tr><td id="0,0" colspan="2">d</td></tr>
            <tr><td id="1,0">d</td><th id="1,1">h</th></tr>
          </table>
        `,
        container);

    expect(hasDataInColumn(getTable(), getCell('1,1'))).toBeTrue();
  });

  it('takes into account colspan on target element', () => {
    render(
        html`
          <table>
            <tr><th id="0,0" colspan="2">h</th></tr>
            <tr><th id="1,0">h</th><td id="1,1">d</td></tr>
          </table>
        `,
        container);
    expect(hasDataInColumn(getTable(), getCell('0,0'))).toBeTrue();
  });
});

describe('gridFromTable', () => {
  it('builds a simple grid', () => {
    render(
        html`
          <table>
            <tr><th id="0,0">h</th><th id="0,1">h</th></tr>
            <tr><td id="1,0">d</td><td id="1,1">d</td></tr>
          </table>
        `,
        container);
    const expected = [
      [getCell('0,0'), getCell('0,1')],
      [getCell('1,0'), getCell('1,1')],
    ];
    expect(gridFromTable(getTable())).toEqual(new RenderedGrid(expected));
  });

  it('obeys rowspan and colspan', () => {
    render(
        html`
          <table>
            <tr><th id="0,0">h</th><th colspan="2" id="0,1">h</th></tr>
            <tr><td rowspan="2" id="1,0">d</td><td rowspan="2" colspan="2" id="1,1">d</td></tr>
          </table>
        `,
        container);
    const expected = [
      [getCell('0,0'), getCell('0,1'), getCell('0,1')],
      [getCell('1,0'), getCell('1,1'), getCell('1,1')],
      [getCell('1,0'), getCell('1,1'), getCell('1,1')],
    ];
    expect(gridFromTable(getTable())).toEqual(new RenderedGrid(expected));
  });

  it('combines rows from thead, tbody and tfoot', () => {
    render(
        html`
          <table>
            <thead>
              <tr><th id="thead_0,0">h</th><th rowspan="0" id="thead_0,1">h</th></tr>
              <tr><td id="thead_1,0">d</td></tr>
            </thead>
            <tbody>
              <tr><th id="tbody_0,0">h</th><td id="tbody_0,1">d</td></tr>
            </tbody>
            <tfoot>
              <tr><th id="tfoot_0,0">h</th><td id="tfoot_0,1">d</td></tr>
            </tfoot>
          </table>
        `,
        container);
    const expected = [
      // thead
      [getCell('thead_0,0'), getCell('thead_0,1')],
      [getCell('thead_1,0'), getCell('thead_0,1')],
      // tbody
      [getCell('tbody_0,0'), getCell('tbody_0,1')],
      // tfoot
      [getCell('tfoot_0,0'), getCell('tfoot_0,1')],
    ];
    expect(gridFromTable(getTable())).toEqual(new RenderedGrid(expected));
  });

  it('combines rows from thead, plain tr elements and tfoot', () => {
    render(
        html`
          <table>
            <thead>
              <tr><th id="thead_0,0">h</th><th rowspan="0" id="thead_0,1">h</th></tr>
              <tr><td id="thead_1,0">d</td></tr>
            </thead>
              <tr><th id="tr_0,0">h</th><th id="tr_0,1">h</th></tr>
              <tr><td id="tr_1,0">h</td><td id="tr_1,1" colspan="2" rowspan="2">d</td></tr>
            <tfoot>
              <tr><th id="tfoot_0,0">h</th><td id="tfoot_0,1">d</td></tr>
            </tfoot>
          </table>
        `,
        container);
    const expected = [
      // thead
      [getCell('thead_0,0'), getCell('thead_0,1')],
      [getCell('thead_1,0'), getCell('thead_0,1')],
      // tr elements
      [getCell('tr_0,0'), getCell('tr_0,1')],
      [getCell('tr_1,0'), getCell('tr_1,1'), getCell('tr_1,1')],
      [, getCell('tr_1,1'), getCell('tr_1,1')],
      // tfoot
      [getCell('tfoot_0,0'), getCell('tfoot_0,1')],
    ];
    expect(gridFromTable(getTable())).toEqual(new RenderedGrid(expected));
  });

  it('handles overlapping cells', () => {
    // The second heading and the first cell both want to use the coordinate
    // (1,1). Browsers implement this as the cells overlapping - background
    // colors have been added to these examples so you can see this visually
    render(
        html`
         <table>
          <tr>
            <th id="0,0">h</th>
            <th id="0,1" rowspan="4" style="background-color:green;">h</th>
            <th id="0,2">h</th>
            <th id="0,3">h</th>
            <th id="0,4">h</th>
          </tr>
          <tr>
            <td id="1,0" colspan="3" style="background-color:coral;">d</td>
            <td id="1,1">d</td>
          </tr>
          <tr>
            <td id="2,0">d</td>
          </tr><tr>
            <td id="3,0">d</td>
          </tr>
        </table>
        `,
        container);
    const expected = [
      [
        getCell('0,0'), getCell('0,1'), getCell('0,2'), getCell('0,3'),
        getCell('0,4')
      ],
      [getCell('1,0'), getCell('1,0'), getCell('1,0'), getCell('1,1')],
      [getCell('2,0'), getCell('0,1')],
      [getCell('3,0'), getCell('0,1')],
    ];
    expect(gridFromTable(getTable())).toEqual(new RenderedGrid(expected));
  });

  it('pushes cells right until they can find a first free coordinate', () => {
    // Cells start from the first free coordinate in their row, taking into
    // account rowspan of elements from previous rows.

    // This test case is the same as the previous one but with the data cells
    // in the second row flipped. The wide data cell shouldn't start until the
    // coordinates after the tall header cell
    render(
        html`
         <table>
          <tr>
            <th id="0,0">h</th>
            <th id="0,1" rowspan="4" style="background-color:green;">h</th>
            <th id="0,2">h</th>
            <th id="0,3">h</th>
            <th id="0,4">h</th>
          </tr>
          <tr>
            <td id="1,0">d</td>
            <td id="1,1" colspan="3" style="background-color:coral;">d</td>
          </tr>
          <tr>
            <td id="2,0">d</td>
          </tr><tr>
            <td id="3,0">d</td>
          </tr>
        </table>
        `,
        container);
    const expected = [
      [
        getCell('0,0'), getCell('0,1'), getCell('0,2'), getCell('0,3'),
        getCell('0,4')
      ],
      [
        getCell('1,0'), getCell('0,1'), getCell('1,1'), getCell('1,1'),
        getCell('1,1')
      ],
      [getCell('2,0'), getCell('0,1')],
      [getCell('3,0'), getCell('0,1')],
    ];
    expect(gridFromTable(getTable())).toEqual(new RenderedGrid(expected));
  });
});


it('extends the final non-empty cell downwards', () => {
  render(
      html`
        <table>
          <tr><th id="0,0">h</th><th id="0,1">h</th><th id="0,2" rowspan="0">h</th></tr>
          <tr><td id="1,0">d</td></tr>
          <tr><td id="2,0">d</td><td id="2,1" rowspan="0">d</td></tr>
          <tr><td id="3,0">d</td></tr>
          <tr><td id="4,0">d</td></tr>
        </table>
        `,
      container);

  const expected = [
    [getCell('0,0'), getCell('0,1'), getCell('0,2')],
    [getCell('1,0'), , getCell('0,2')],
    [getCell('2,0'), getCell('2,1'), getCell('0,2')],
    [getCell('3,0'), getCell('2,1'), getCell('0,2')],
    [getCell('4,0'), getCell('2,1'), getCell('0,2')],
  ];

  expect(gridFromTable(getTable())).toEqual(new RenderedGrid(expected));
});
