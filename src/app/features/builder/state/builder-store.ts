import { LiveAnnouncer } from '@angular/cdk/a11y';
import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { DropdownOption } from '../models/dropdown-option';
import { CanvasElement } from '../models/canvas-element';
import {
  cellLabel,
  CellPosition,
  GridAxis,
  GridCell,
  GridLayout,
  MAX_GRID_SIZE,
  MIN_GRID_SIZE,
} from '../models/grid-layout';
import { ELEMENT_LABELS, PaletteItem } from '../models/palette-item';

interface BuilderState {
  paletteItems: PaletteItem[];
  grid: GridLayout;
  canvasElements: CanvasElement[];
}

export const DEFAULT_ELEMENT_TEXT = 'enter text';

const createInitialState = (): BuilderState => ({
  paletteItems: [
    { uid: crypto.randomUUID(), type: 'div', label: ELEMENT_LABELS.div },
    { uid: crypto.randomUUID(), type: 'span', label: ELEMENT_LABELS.span },
    { uid: crypto.randomUUID(), type: 'text-input', label: ELEMENT_LABELS['text-input'] },
    { uid: crypto.randomUUID(), type: 'textfield', label: ELEMENT_LABELS.textfield },
    { uid: crypto.randomUUID(), type: 'datepicker', label: ELEMENT_LABELS.datepicker },
    { uid: crypto.randomUUID(), type: 'dropdown', label: ELEMENT_LABELS.dropdown },
  ],
  grid: { rows: 1, columns: 1 },
  canvasElements: [],
});

const createElement = (
  { uid: paletteUid, type }: PaletteItem,
  { row, column }: CellPosition,
): CanvasElement => {
  const base = { uid: crypto.randomUUID(), paletteUid, row, column };
  switch (type) {
    case 'div':
    case 'span':
      return { ...base, type, text: DEFAULT_ELEMENT_TEXT };
    case 'text-input':
    case 'textfield':
      return { ...base, type, text: DEFAULT_ELEMENT_TEXT, value: '' };
    case 'datepicker':
      return { ...base, type, value: '' };
    case 'dropdown':
      return { ...base, type, options: [], value: '' };
  }
};

const hasOption = (options: DropdownOption[], value: string): boolean =>
  options.some((option) => option.value === value);

const selectedValue = (options: DropdownOption[], current: string): string =>
  hasOption(options, current) ? current : (options[0]?.value ?? '');

const CELL_AXIS: Record<GridAxis, keyof CellPosition> = { rows: 'row', columns: 'column' };

const clampGridSize = (size: number): number =>
  Math.min(MAX_GRID_SIZE, Math.max(MIN_GRID_SIZE, Math.trunc(size)));

const isInCell = (element: CanvasElement, { row, column }: CellPosition): boolean =>
  element.row === row && element.column === column;

const positionInCell = (elements: CanvasElement[], element: CanvasElement): number =>
  elements.filter((other) => isInCell(other, element)).indexOf(element);

const countOf = (count: number, noun: string): string => `${count} ${noun}${count === 1 ? '' : 's'}`;

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
        const cell: CellPosition = {
          row: Math.floor(cellIndex / columns),
          column: cellIndex % columns,
        };
        return { ...cell, elements: elements.filter((element) => isInCell(element, cell)) };
      });
    }),
  })),
  /*
   * Changes to the canvas are announced here rather than by the component that asked for them, so
   * a drag and its keyboard alternative report the same outcome to screen reader users.
   */
  withMethods((store, announcer = inject(LiveAnnouncer)) => ({
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
      const { rows, columns } = store.grid();
      announcer.announce(`Grid set to ${countOf(rows, 'row')} and ${countOf(columns, 'column')}.`);
    },
    addElement(item: PaletteItem, cell: CellPosition, index: number): void {
      const element = createElement(item, cell);
      patchState(store, ({ canvasElements }) => ({
        canvasElements: insertIntoCell(canvasElements, element, index),
      }));
      announcer.announce(`${item.label} added to ${cellLabel(cell)}.`);
    },
    updateText(uid: string, text: string): void {
      patchState(store, ({ canvasElements }) => ({
        canvasElements: canvasElements.map((element) =>
          element.uid === uid && 'text' in element ? { ...element, text } : element,
        ),
      }));
    },
    updateOptions(uid: string, options: DropdownOption[]): void {
      patchState(store, ({ canvasElements }) => ({
        canvasElements: canvasElements.map((element) =>
          element.uid === uid && element.type === 'dropdown'
            ? { ...element, options, value: selectedValue(options, element.value) }
            : element,
        ),
      }));
    },
    updateValue(uid: string, value: string): void {
      patchState(store, ({ canvasElements }) => ({
        canvasElements: canvasElements.map((element) => {
          if (element.uid !== uid || !('value' in element)) {
            return element;
          }
          if (element.type === 'dropdown' && !hasOption(element.options, value)) {
            return element;
          }
          return { ...element, value };
        }),
      }));
    },
    removeElement(uid: string): void {
      const element = store.canvasElements().find((candidate) => candidate.uid === uid);
      if (!element) {
        return;
      }
      patchState(store, ({ canvasElements }) => ({
        canvasElements: canvasElements.filter((candidate) => candidate !== element),
      }));
      announcer.announce(`${ELEMENT_LABELS[element.type]} deleted.`);
    },
    moveElement(uid: string, cell: CellPosition, index: number): void {
      const element = store.canvasElements().find((candidate) => candidate.uid === uid);
      if (!element) {
        return;
      }
      const previousPosition = positionInCell(store.canvasElements(), element);
      const moved: CanvasElement = { ...element, row: cell.row, column: cell.column };
      patchState(store, ({ canvasElements }) => ({
        canvasElements: insertIntoCell(
          canvasElements.filter((candidate) => candidate !== element),
          moved,
          index,
        ),
      }));

      const label = ELEMENT_LABELS[element.type];
      if (!isInCell(element, cell)) {
        announcer.announce(`${label} moved to ${cellLabel(cell)}.`);
        return;
      }
      const position = positionInCell(store.canvasElements(), moved);
      if (position !== previousPosition) {
        const count = store.canvasElements().filter((other) => isInCell(other, cell)).length;
        announcer.announce(`${label} moved to position ${position + 1} of ${count}.`);
      }
    },
  })),
);
