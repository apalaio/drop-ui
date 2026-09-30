import { ElementType } from './palette-item';

/** An element instance placed on the canvas. Its position in the store's list is its order on the page. */
export interface CanvasElement {
  /** Unique per dropped instance; dropping the same palette item twice yields two uids. */
  uid: string;
  type: ElementType;
  /** uid of the palette item this element was created from. */
  paletteUid: string;
  /** Text content rendered inside the element. */
  text: string;
}
