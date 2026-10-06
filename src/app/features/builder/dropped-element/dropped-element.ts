import { Dialog } from '@angular/cdk/dialog';
import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { Component, computed, inject, input } from '@angular/core';
import { openConfirmationDialog } from '../../../shared/confirmation-dialog/confirmation-dialog';
import { openDropdownOptionsDialog } from '../dropdown-options-dialog/dropdown-options-dialog';
import { openTextInputDialog } from '../../../shared/text-input-dialog/text-input-dialog';
import {
  CanvasElement,
  DropdownCanvasElement,
  TextCanvasElement,
  TextControlCanvasElement,
} from '../models/canvas-element';
import { ElementType } from '../models/palette-item';
import { BuilderStore } from '../state/builder-store';

const HOVER_OUTLINE: Record<ElementType, string> = {
  div: 'border-dashed hover:border-primary/40',
  span: 'border-dotted hover:border-secondary',
  'text-input': 'border-dashed hover:border-info',
  textfield: 'border-dashed hover:border-info',
  datepicker: 'border-dashed hover:border-info',
  dropdown: 'border-dashed hover:border-accent',
};

@Component({
  selector: 'dui-dropped-element',
  imports: [CdkMenuTrigger, CdkMenu, CdkMenuItem],
  templateUrl: './dropped-element.html',
  host: {
    class: 'group relative mb-2 cursor-grab rounded-box border border-transparent p-1 pr-10',
    '[class]': 'display() + " " + hoverOutline()',
    '[attr.data-uid]': 'element().uid',
    '[attr.data-element-type]': 'element().type',
  },
})
export class DroppedElement {
  readonly element = input.required<CanvasElement>();

  protected readonly display = computed(() =>
    this.element().type === 'span' ? 'mr-2 inline-block align-top' : 'block',
  );
  protected readonly hoverOutline = computed(() => HOVER_OUTLINE[this.element().type]);

  private readonly store = inject(BuilderStore);
  private readonly dialog = inject(Dialog);

  protected editText({ uid, type, text }: TextCanvasElement | TextControlCanvasElement): void {
    openTextInputDialog(this.dialog, {
      title: 'Edit text',
      description: `Change the text shown inside this <${type}>.`,
      value: text,
    }).subscribe((newText) => {
      if (newText !== undefined) {
        this.store.updateText(uid, newText);
      }
    });
  }

  protected editOptions({ uid, type, options }: DropdownCanvasElement): void {
    openDropdownOptionsDialog(this.dialog, {
      title: 'Edit options',
      description: `Set the text and value of each option in this <${type}>.`,
      options,
    }).subscribe((newOptions) => {
      if (newOptions !== undefined) {
        this.store.updateOptions(uid, newOptions);
      }
    });
  }

  protected updateValue(
    uid: string,
    control: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  ): void {
    if (!control.validity.badInput) {
      this.store.updateValue(uid, control.value);
    }
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
