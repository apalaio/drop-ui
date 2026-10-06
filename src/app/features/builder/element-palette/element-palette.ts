import { CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { Component, inject } from '@angular/core';
import { cellLabel, GridCell } from '../models/grid-layout';
import { PaletteItem } from '../models/palette-item';
import { BuilderStore } from '../state/builder-store';

@Component({
  selector: 'dui-element-palette',
  imports: [CdkDropList, CdkDrag, CdkMenuTrigger, CdkMenu, CdkMenuItem],
  templateUrl: './element-palette.html',
  host: { class: 'block p-4' },
})
export class ElementPalette {
  protected readonly store = inject(BuilderStore);
  protected readonly cellLabel = cellLabel;

  /** The palette is a source only: its own items may return, nothing else may enter. */
  protected readonly acceptNothing = () => false;

  /** The keyboard and single-click counterpart of dropping the item at the end of a cell. */
  protected add(item: PaletteItem, cell: GridCell): void {
    this.store.addElement(item, cell, cell.elements.length);
  }
}
