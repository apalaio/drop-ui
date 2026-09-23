export type ElementType = 'div';

export interface PaletteItem {
  /** Unique per item, distinguishes it from every other item in the palette. */
  uid: string;
  type: ElementType;
  label: string;
}
