import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CanvasElement } from '../models/canvas-element';
import { GridCell } from '../models/grid-layout';
import { PaletteItem } from '../models/palette-item';
import { BuilderStore } from '../state/builder-store';
import { Canvas } from './canvas';

type DropEvent = CdkDragDrop<GridCell, unknown, PaletteItem | CanvasElement>;

describe('Canvas', () => {
  const paletteList = { id: 'palette-drop-list' };
  const divItem: PaletteItem = { uid: 'palette-div', type: 'div', label: 'Div' };
  const element: CanvasElement = {
    uid: 'element-1',
    type: 'div',
    paletteUid: 'palette-div',
    text: 'enter text',
    row: 0,
    column: 0,
  };

  let store: { addElement: ReturnType<typeof vi.fn>; moveElement: ReturnType<typeof vi.fn> };
  let canvas: Canvas;

  beforeEach(() => {
    store = { addElement: vi.fn(), moveElement: vi.fn() };
    const grid = { grid: signal({ rows: 2, columns: 3 }), cells: signal<GridCell[]>([]) };
    TestBed.configureTestingModule({ providers: [{ provide: BuilderStore, useValue: { ...grid, ...store } }] });
    canvas = TestBed.runInInjectionContext(() => new Canvas());
  });

  function cellList(row: number, column: number): { data: GridCell } {
    return { data: { row, column, elements: [] } };
  }

  function drop(event: Record<string, unknown>): void {
    canvas['drop'](event as unknown as DropEvent);
  }

  it('adds a palette item dropped from the palette to the target cell at the drop index', () => {
    drop({
      previousContainer: paletteList,
      container: cellList(1, 2),
      item: { data: divItem },
      previousIndex: 0,
      currentIndex: 2,
    });

    expect(store.addElement).toHaveBeenCalledWith(divItem, expect.objectContaining({ row: 1, column: 2 }), 2);
    expect(store.moveElement).not.toHaveBeenCalled();
  });

  it('reorders an element dragged within its cell', () => {
    const cell = cellList(0, 0);

    drop({ previousContainer: cell, container: cell, item: { data: element }, previousIndex: 0, currentIndex: 3 });

    expect(store.moveElement).toHaveBeenCalledWith(element.uid, expect.objectContaining({ row: 0, column: 0 }), 3);
    expect(store.addElement).not.toHaveBeenCalled();
  });

  it('moves an element dragged into another cell to that cell at the drop index', () => {
    drop({
      previousContainer: cellList(0, 0),
      container: cellList(1, 1),
      item: { data: element },
      previousIndex: 0,
      currentIndex: 1,
    });

    expect(store.moveElement).toHaveBeenCalledWith(element.uid, expect.objectContaining({ row: 1, column: 1 }), 1);
    expect(store.addElement).not.toHaveBeenCalled();
  });
});
