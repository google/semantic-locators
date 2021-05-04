/**
 * @license
 * Copyright 2021 The Semantic Locators Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert, hasTagName, isHTMLElement} from './util';

/** Whether there is a <td> cell in the same row as `cell`. */
export function hasDataInRow(
    table: HTMLTableElement, cell: HTMLTableCellElement) {
  const grid = gridFromTable(table);
  const {minY, maxY} = grid.getRectangle(cell);
  return grid.getCells()
      .slice(minY, maxY + 1)
      .some(row => row.some(isDataCell));
}

/** Whether there is a <td> cell in the same column as `cell`. */
export function hasDataInColumn(
    table: HTMLTableElement, cell: HTMLTableCellElement) {
  const grid = gridFromTable(table);
  const {minX, maxX} = grid.getRectangle(cell);
  return grid.getCells().some(
      row => row.slice(minX, maxX + 1).some(isDataCell));
}

interface Rectangle {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

class RenderedGrid {
  constructor(
      private cells: Array<Array<HTMLTableCellElement|undefined>> = []) {}

  get height() {
    return this.cells.length;
  }

  get width() {
    return Math.max(...this.cells.map(row => row.length));
  }

  cell(x: number, y: number): HTMLTableCellElement|undefined {
    return this.row(y)[x];
  }

  setCell(x: number, y: number, element: HTMLTableCellElement) {
    this.row(y)[x] = element;
  }

  row(y: number): Array<HTMLTableCellElement|undefined> {
    if (this.cells[y] === undefined) {
      this.cells[y] = [];
    }
    return this.cells[y];
  }

  getCells() {
    return this.cells;
  }

  getRectangle(cell: HTMLTableCellElement): Rectangle {
    let minX = this.width;
    let minY = this.height;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < this.height; y++) {
      const row = this.row(y);
      const x = row.indexOf(cell);
      if (x !== -1) {
        maxX = Math.max(maxX, row.lastIndexOf(cell));
        maxY = Math.max(maxY, y);
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
      }
    }
    assert(
        maxX < this.width && maxY < this.height && minX > -1 && minY > -1,
        'Target cell not found in table');
    return {minX, minY, maxX, maxY};
  }

  concat(other: RenderedGrid) {
    this.cells = this.getCells().concat(other.getCells());
  }
}


/**
 * Turn a table into a grid of cells, where the coordinates are (y, x) with x
 * and y defined in
 * https://html.spec.whatwg.org/multipage/tables.html#forming-a-table.
 *
 * This function respects colspan and rowspan, including rowspan=0 (which means
 * a cell should extend down to the end of the group of rows).
 */
function gridFromTable(table: HTMLTableElement): RenderedGrid {
  const grid = new RenderedGrid();

  // These must be in the order of appearance. First <thead>, then <tbody> or
  // <tr> (mutually exclusive) then <tfoot>
  if (table.tHead !== null) {
    grid.concat(gridFromRows(table.tHead.rows));
  }
  for (const body of table.tBodies) {
    grid.concat(gridFromRows(body.rows));
  }

  const directChildren: HTMLTableRowElement[] = [];
  // Can't use table.rows as that would double count rows in table.tHead
  for (const child of table.children) {
    if (isHTMLElement(child) && hasTagName(child, 'tr')) {
      directChildren.push(child);
    }
  }

  grid.concat(gridFromRows(directChildren));

  if (table.tFoot !== null) {
    grid.concat(gridFromRows(table.tFoot.rows));
  }

  return grid;
}

function gridFromRows(rows: ArrayLike<HTMLTableRowElement>): RenderedGrid {
  const grid = new RenderedGrid();
  // Columns with a rowspan="0" cell
  const fullColumns: HTMLTableCellElement[] = [];
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    let nextFreeCol = 0;

    for (const cell of rows[rowIndex].cells) {
      // Find the first free slot, populating full columns as we go
      while (grid.cell(nextFreeCol, rowIndex) || fullColumns[nextFreeCol]) {
        if (!isDataCell(grid.cell(nextFreeCol, rowIndex)) &&
            fullColumns[nextFreeCol]) {
          grid.setCell(nextFreeCol, rowIndex, fullColumns[nextFreeCol]);
        }
        nextFreeCol++;
      }

      // From the first free slot, cell should take every free cell until its
      // colSpan is over. This is the behaviour exhibited by browsers, see unit
      // tests for examples.
      // colspan="0" is not valid. It was allowed in HTML 4 but later removed.
      // rowspan="0" may be later removed at which point this code must be
      // changed (https://github.com/w3c/html/issues/284)
      for (let x = nextFreeCol; x < nextFreeCol + cell.colSpan; x++) {
        // 0 row span means extend the cell until the bottom of the table
        if (rowSpan(cell) === 0) {
          fullColumns[x] = cell;
          grid.setCell(x, rowIndex, cell);
        }
        for (let y = rowIndex; y < rowIndex + rowSpan(cell); y++) {
          // If multiple cells overlap, browsers render content from both cells
          // at these coordinates. However we only care whether there is data in
          // a row/column so have data cells take precedence
          if (!isDataCell(grid.cell(x, y))) {
            grid.setCell(x, y, cell);
          }
        }
      }
      nextFreeCol += cell.colSpan;
    }

    // Fill any remaining fullColumns for the row
    for (let x = nextFreeCol; x < grid.width; x++) {
      const fillerCell = fullColumns[x];
      if (fillerCell !== undefined && !isDataCell(grid.cell(x, rowIndex))) {
        grid.setCell(x, rowIndex, fillerCell);
      }
    }
  }
  return grid;
}

/**
 * On IE element.rowSpan returns 1 for <th rowspan="0"> (IE also incorrectly
 * renders these elements). We can instead get the attribute directly.
 */
function rowSpan(element: HTMLTableCellElement): number {
  const attr = element.getAttribute('rowSpan');
  if (attr === null || attr.trim() === '') {
    // Default
    return 1;
  }
  const parsed = Number(attr);
  return isNaN(parsed) ? 1 : parsed;
}

function isDataCell(cell: HTMLTableCellElement|undefined) {
  return cell !== undefined && hasTagName(cell, 'td');
}

export const TEST_ONLY = {
  gridFromTable,
  RenderedGrid,
};
