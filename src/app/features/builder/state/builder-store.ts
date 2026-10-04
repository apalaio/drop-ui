import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { CanvasElement } from '../models/canvas-element';
import {
  CellPosition,
  GridAxis,
  GridCell,
  GridLayout,
  MAX_GRID_SIZE,
  MIN_GRID_SIZE,
} from '../models/grid-layout';
import { PaletteItem } from '../models/palette-item';

interface BuilderState {
  paletteItems: PaletteItem[];
  grid: GridLayout;
  /** Flat across all cells; only the relative order of elements that share a cell is meaningful. */
  canvasElements: CanvasElement[];
}

/** Text a freshly dropped element starts with, until the user edits it. */
export const DEFAULT_ELEMENT_TEXT = 'enter text';

const createInitialState = (): BuilderState => ({
  paletteItems: [
    { uid: crypto.randomUUID(), type: 'div', label: 'Div' },
    { uid: crypto.randomUUID(), type: 'span', label: 'Span' },
  ],
  grid: { rows: 1, columns: 1 },
  canvasElements: [],
});

const CELL_AXIS: Record<GridAxis, keyof CellPosition> = { rows: 'row', columns: 'column' };

const clampGridSize = (size: number): number =>
  Math.min(MAX_GRID_SIZE, Math.max(MIN_GRID_SIZE, Math.trunc(size)));

const isInCell = (element: CanvasElement, { row, column }: CellPosition): boolean =>
  element.row === row && element.column === column;

/** Inserts `element` at `index` among the elements of its own cell; every other cell keeps its order. */
const insertIntoCell = (
  elements: CanvasElement[],
  element: CanvasElement,
  index: number,
): CanvasElement[] => {
  const next = elements.filter((other) => isInCell(other, element))[index];
  const flatIndex = next ? elements.indexOf(next) : elements.length;
  return [...elements.slice(0, flatIndex), element, ...elements.slice(flatIndex)];
};

export const BuilderStore = signalStore(
  { providedIn: 'root' },
  withState(createInitialState),
  withComputed(({ grid, canvasElements }) => ({
    cells: computed<GridCell[]>(() => {
      const { rows, columns } = grid();
      const elements = canvasElements();
      return Array.from({ length: rows * columns }, (_, cellIndex) => {
        const cell: CellPosition = { row: Math.floor(cellIndex / columns), column: cellIndex % columns };
        return { ...cell, elements: elements.filter((element) => isInCell(element, cell)) };
      });
    }),
  })),
  withMethods((store) => ({
    /** Elements in removed rows or columns move to the last remaining one. */
    setGridSize(axis: GridAxis, size: number): void {
      if (!Number.isFinite(size)) {
        return;
      }
      const last = clampGridSize(size) - 1;
      const position = CELL_AXIS[axis];
      patchState(store, ({ grid, canvasElements }) => ({
        grid: { ...grid, [axis]: last + 1 },
        canvasElements: canvasElements.map((element) =>
          element[position] > last ? { ...element, [position]: last } : element,
        ),
      }));
    },
    addElement(item: PaletteItem, cell: CellPosition, index: number): void {
      const element: CanvasElement = {
        uid: crypto.randomUUID(),
        type: item.type,
        paletteUid: item.uid,
        text: DEFAULT_ELEMENT_TEXT,
        row: cell.row,
        column: cell.column,
      };
      patchState(store, ({ canvasElements }) => ({
        canvasElements: insertIntoCell(canvasElements, element, index),
      }));
    },
    updateText(uid: string, text: string): void {
      patchState(store, ({ canvasElements }) => ({
        canvasElements: canvasElements.map((element) =>
          element.uid === uid ? { ...element, text } : element,
        ),
      }));
    },
    removeElement(uid: string): void {
      patchState(store, ({ canvasElements }) => ({
        canvasElements: canvasElements.filter((element) => element.uid !== uid),
      }));
    },
    /** Moves an element to `index` in `cell`, counted without the element itself. */
    moveElement(uid: string, cell: CellPosition, index: number): void {
      patchState(store, ({ canvasElements }) => {
        const element = canvasElements.find((candidate) => candidate.uid === uid);
        if (!element) {
          return {};
        }
        const moved: CanvasElement = { ...element, row: cell.row, column: cell.column };
        const others = canvasElements.filter((candidate) => candidate !== element);
        return { canvasElements: insertIntoCell(others, moved, index) };
      });
    },
  })),
);
