import { Component, inject } from '@angular/core';
import { GridAxis, MAX_GRID_SIZE, MIN_GRID_SIZE } from '../models/grid-layout';
import { BuilderStore } from '../state/builder-store';

@Component({
  selector: 'dui-layout-panel',
  templateUrl: './layout-panel.html',
  host: { class: 'block px-4 pt-4' },
})
export class LayoutPanel {
  protected readonly store = inject(BuilderStore);

  protected readonly minSize = MIN_GRID_SIZE;
  protected readonly maxSize = MAX_GRID_SIZE;

  /*
   * Committed on change rather than per keystroke: typing "12" passes through "1", which would
   * shrink the grid and pull every element into the first row before it grows again.
   */
  protected commit(axis: GridAxis, input: HTMLInputElement): void {
    this.store.setGridSize(axis, input.valueAsNumber);
    this.show(axis, input);
  }

  /*
   * An entry the store rejected or clamped can leave the store's value as it was, in which case the
   * [value] binding does not fire and the field keeps what was typed. This writes it back by hand.
   */
  protected show(axis: GridAxis, input: HTMLInputElement): void {
    input.value = String(this.store.grid()[axis]);
  }
}
