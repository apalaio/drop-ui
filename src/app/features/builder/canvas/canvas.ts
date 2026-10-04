import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { Component, computed, inject } from '@angular/core';
import { DroppedElement } from '../dropped-element/dropped-element';
import { CanvasElement } from '../models/canvas-element';
import { GridCell } from '../models/grid-layout';
import { PaletteItem } from '../models/palette-item';
import { BuilderStore } from '../state/builder-store';

const equalTracks = (count: number): string => `repeat(${count}, minmax(0, 1fr))`;

@Component({
  selector: 'dui-canvas',
  imports: [CdkDropList, CdkDrag, DroppedElement],
  templateUrl: './canvas.html',
  host: { class: 'block h-full' },
})
export class Canvas {
  protected readonly store = inject(BuilderStore);

  protected readonly gridTemplateRows = computed(() => equalTracks(this.store.grid().rows));
  protected readonly gridTemplateColumns = computed(() => equalTracks(this.store.grid().columns));

  protected drop(event: CdkDragDrop<GridCell, unknown, PaletteItem | CanvasElement>): void {
    const { row, column } = event.container.data;
    const item = event.item.data;
    if ('paletteUid' in item) {
      this.store.moveElement(item.uid, { row, column }, event.currentIndex);
    } else {
      this.store.addElement(item, { row, column }, event.currentIndex);
    }
  }
}
