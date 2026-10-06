import { TestBed } from '@angular/core/testing';
import { CanvasElement } from '../models/canvas-element';
import { GridCell } from '../models/grid-layout';
import { PaletteItem } from '../models/palette-item';
import { BuilderStore } from '../state/builder-store';
import { ElementPalette } from './element-palette';

describe('ElementPalette', () => {
  const divItem: PaletteItem = { uid: 'palette-div', type: 'div', label: 'Block text' };
  const existing: CanvasElement = {
    uid: 'element-1',
    type: 'div',
    paletteUid: 'palette-div',
    text: 'enter text',
    row: 1,
    column: 2,
  };

  let store: { addElement: ReturnType<typeof vi.fn> };
  let palette: ElementPalette;

  beforeEach(() => {
    store = { addElement: vi.fn() };
    TestBed.configureTestingModule({ providers: [{ provide: BuilderStore, useValue: store }] });
    palette = TestBed.runInInjectionContext(() => new ElementPalette());
  });

  it('adds the item as the first element of an empty cell', () => {
    const cell: GridCell = { row: 0, column: 0, elements: [] };

    palette['add'](divItem, cell);

    expect(store.addElement).toHaveBeenCalledWith(divItem, cell, 0);
  });

  it('adds the item after the elements the cell already holds', () => {
    const cell: GridCell = { row: 1, column: 2, elements: [existing, { ...existing, uid: 'element-2' }] };

    palette['add'](divItem, cell);

    expect(store.addElement).toHaveBeenCalledWith(divItem, cell, 2);
  });

  it('lets nothing be dropped onto the palette', () => {
    expect(palette['acceptNothing']()).toBe(false);
  });
});
