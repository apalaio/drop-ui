import { CanvasElement } from './canvas-element';

export const MIN_GRID_SIZE = 1;
export const MAX_GRID_SIZE = 12;

export interface CellPosition {
  row: number;
  column: number;
}

export interface GridLayout {
  rows: number;
  columns: number;
}

export type GridAxis = keyof GridLayout;

export interface GridCell extends CellPosition {
  elements: CanvasElement[];
}
