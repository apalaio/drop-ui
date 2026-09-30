import { Dialog } from '@angular/cdk/dialog';
import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { Component, computed, inject, input } from '@angular/core';
import { openConfirmationDialog } from '../../../shared/confirmation-dialog/confirmation-dialog';
import { openTextInputDialog } from '../../../shared/text-input-dialog/text-input-dialog';
import { CanvasElement } from '../models/canvas-element';
import { ElementType } from '../models/palette-item';
import { BuilderStore } from '../state/builder-store';

/** Hover outline per element type, so element kinds are distinguishable on the canvas. */
const HOVER_OUTLINE: Record<ElementType, string> = {
  div: 'border-dashed hover:border-primary/40',
  span: 'border-dotted hover:border-secondary',
};

/** Builder chrome around a single dropped element; renders the real element inside. */
@Component({
  selector: 'dui-dropped-element',
  imports: [CdkMenuTrigger, CdkMenu, CdkMenuItem],
  templateUrl: './dropped-element.html',
  host: {
    class: 'group relative block cursor-grab rounded-box border border-transparent p-1 pr-10',
    '[class]': 'hoverOutline()',
    '[attr.data-uid]': 'element().uid',
    '[attr.data-element-type]': 'element().type',
  },
})
export class DroppedElement {
  readonly element = input.required<CanvasElement>();

  protected readonly hoverOutline = computed(() => HOVER_OUTLINE[this.element().type]);

  private readonly store = inject(BuilderStore);
  private readonly dialog = inject(Dialog);

  protected editText(): void {
    const { uid, text } = this.element();
    openTextInputDialog(this.dialog, {
      title: 'Edit text',
      description: `Change the text shown inside this <${this.element().type}>.`,
      value: text,
    }).subscribe((newText) => {
      if (newText !== undefined) {
        this.store.updateText(uid, newText);
      }
    });
  }

  protected deleteElement(): void {
    const { uid, type } = this.element();
    openConfirmationDialog(this.dialog, {
      title: 'Delete element',
      description: `Remove this <${type}> from the canvas? This cannot be undone.`,
      confirmLabel: 'Delete',
    }).subscribe((confirmed) => {
      if (confirmed) {
        this.store.removeElement(uid);
      }
    });
  }
}
