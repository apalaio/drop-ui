import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { TestBed } from '@angular/core/testing';
import { CanvasElement } from '../models/canvas-element';
import { PaletteItem } from '../models/palette-item';
import { BuilderStore } from '../state/builder-store';
import { Canvas } from './canvas';

type DropEvent = CdkDragDrop<unknown, unknown, PaletteItem | CanvasElement>;

describe('Canvas', () => {
  const canvasList = { id: 'canvas' };
  const paletteList = { id: 'palette' };
  const divItem: PaletteItem = { uid: 'palette-div', type: 'div', label: 'Div' };

  let store: { addElement: ReturnType<typeof vi.fn>; moveElement: ReturnType<typeof vi.fn> };
  let canvas: Canvas;

  beforeEach(() => {
    store = { addElement: vi.fn(), moveElement: vi.fn() };
    TestBed.configureTestingModule({ providers: [{ provide: BuilderStore, useValue: store }] });
    canvas = TestBed.runInInjectionContext(() => new Canvas());
  });

  function drop(event: Record<string, unknown>): void {
    canvas['drop']({ container: canvasList, ...event } as unknown as DropEvent);
  }

  it('adds a palette item dropped from the palette at the drop index', () => {
    drop({ previousContainer: paletteList, item: { data: divItem }, currentIndex: 2 });

    expect(store.addElement).toHaveBeenCalledWith(divItem, 2);
    expect(store.moveElement).not.toHaveBeenCalled();
  });

  it('reorders an element dragged within the canvas', () => {
    drop({ previousContainer: canvasList, previousIndex: 0, currentIndex: 3 });

    expect(store.moveElement).toHaveBeenCalledWith(0, 3);
    expect(store.addElement).not.toHaveBeenCalled();
  });
});
