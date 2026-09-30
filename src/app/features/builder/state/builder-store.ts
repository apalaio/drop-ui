import { moveItemInArray } from '@angular/cdk/drag-drop';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { CanvasElement } from '../models/canvas-element';
import { PaletteItem } from '../models/palette-item';

interface BuilderState {
  paletteItems: PaletteItem[];
  /** Ordered top to bottom as rendered on the canvas. */
  canvasElements: CanvasElement[];
}

/** Text a freshly dropped element starts with, until the user edits it. */
export const DEFAULT_ELEMENT_TEXT = 'enter text';

const createInitialState = (): BuilderState => ({
  paletteItems: [
    { uid: crypto.randomUUID(), type: 'div', label: 'Div' },
    { uid: crypto.randomUUID(), type: 'span', label: 'Span' },
  ],
  canvasElements: [],
});

export const BuilderStore = signalStore(
  { providedIn: 'root' },
  withState(createInitialState),
  withMethods((store) => ({
    /** Creates a new canvas element from a palette item and inserts it at `index`. */
    addElement(item: PaletteItem, index: number): void {
      const element: CanvasElement = {
        uid: crypto.randomUUID(),
        type: item.type,
        paletteUid: item.uid,
        text: DEFAULT_ELEMENT_TEXT,
      };
      patchState(store, ({ canvasElements }) => ({
        canvasElements: [...canvasElements.slice(0, index), element, ...canvasElements.slice(index)],
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
    moveElement(fromIndex: number, toIndex: number): void {
      patchState(store, ({ canvasElements }) => {
        const reordered = [...canvasElements];
        moveItemInArray(reordered, fromIndex, toIndex);
        return { canvasElements: reordered };
      });
    },
  })),
);
