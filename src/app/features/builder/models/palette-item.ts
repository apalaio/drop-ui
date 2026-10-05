export type ElementType = 'div' | 'span' | 'text-input' | 'textfield' | 'datepicker' | 'dropdown';

export interface PaletteItem {
  /** Unique per item, distinguishes it from every other item in the palette. */
  uid: string;
  type: ElementType;
  label: string;
}
