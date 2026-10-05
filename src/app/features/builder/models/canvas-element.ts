import { DropdownOption } from '../../../shared/dropdown-options-dialog/dropdown-option';
import { ElementType } from './palette-item';

/** An element instance placed on the canvas. Its position among the elements of its cell is its order in that cell. */
interface BaseCanvasElement<T extends ElementType> {
  /** Unique per dropped instance; dropping the same palette item twice yields two uids. */
  uid: string;
  type: T;
  /** uid of the palette item this element was created from. */
  paletteUid: string;
  row: number;
  column: number;
}

export interface TextCanvasElement extends BaseCanvasElement<
  'div' | 'span' | 'text-input' | 'textfield'
> {
  text: string;
}

export interface DatepickerCanvasElement extends BaseCanvasElement<'datepicker'> {}

export interface DropdownCanvasElement extends BaseCanvasElement<'dropdown'> {
  options: DropdownOption[];
}

export type CanvasElement = TextCanvasElement | DatepickerCanvasElement | DropdownCanvasElement;
