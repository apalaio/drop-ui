import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { Component, inject } from '@angular/core';
import { DroppedElement } from '../dropped-element/dropped-element';
import { CanvasElement } from '../models/canvas-element';
import { PaletteItem } from '../models/palette-item';
import { BuilderStore } from '../state/builder-store';

@Component({
  selector: 'dui-canvas',
  imports: [CdkDropList, CdkDrag, DroppedElement],
  templateUrl: './canvas.html',
  host: { class: 'block h-full' },
})
export class Canvas {
  protected readonly store = inject(BuilderStore);

  protected drop(event: CdkDragDrop<unknown, unknown, PaletteItem | CanvasElement>): void {
    if (event.previousContainer === event.container) {
      this.store.moveElement(event.previousIndex, event.currentIndex);
    } else {
      this.store.addElement(event.item.data as PaletteItem, event.currentIndex);
    }
  }
}
