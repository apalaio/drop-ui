import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import {
  afterNextRender,
  Component,
  computed,
  inject,
  Injector,
  viewChildren,
} from '@angular/core';
import { DroppedElement } from '../dropped-element/dropped-element';
import { CanvasElement } from '../models/canvas-element';
import { cellLabel, GridCell } from '../models/grid-layout';
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
  protected readonly cellLabel = cellLabel;

  private readonly injector = inject(Injector);
  private readonly droppedElements = viewChildren(DroppedElement);

  protected drop(event: CdkDragDrop<GridCell, unknown, PaletteItem | CanvasElement>): void {
    const { row, column } = event.container.data;
    const item = event.item.data;
    if ('paletteUid' in item) {
      this.store.moveElement(item.uid, { row, column }, event.currentIndex);
    } else {
      this.store.addElement(item, { row, column }, event.currentIndex);
    }
  }

  /*
   * An element moved from its own menu is re-rendered in its new place, which drops the keyboard
   * focus on <body>. Focus follows the element so the user can keep working on it.
   */
  protected focusElement(uid: string): void {
    afterNextRender(
      () =>
        this.droppedElements()
          .find((dropped) => dropped.element().uid === uid)
          ?.focusActions(),
      { injector: this.injector },
    );
  }

  /** A deleted element takes the focus with it; the cell it was in is the nearest thing left. */
  protected focusCell(cell: HTMLElement): void {
    afterNextRender(() => cell.focus(), { injector: this.injector });
  }
}
