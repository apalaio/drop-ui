export type ElementType = 'div' | 'span';

export interface PaletteItem {
  /** Unique per item, distinguishes it from every other item in the palette. */
  uid: string;
  type: ElementType;
  label: string;
}
