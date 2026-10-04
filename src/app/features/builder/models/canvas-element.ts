import { ElementType } from './palette-item';

/** An element instance placed on the canvas. Its position among the elements of its cell is its order in that cell. */
export interface CanvasElement {
  /** Unique per dropped instance; dropping the same palette item twice yields two uids. */
  uid: string;
  type: ElementType;
  /** uid of the palette item this element was created from. */
  paletteUid: string;
  /** Text content rendered inside the element. */
  text: string;
  row: number;
  column: number;
}
