import { Dialog } from '@angular/cdk/dialog';
import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { Component, computed, ElementRef, inject, input, output, viewChild } from '@angular/core';
import { openConfirmationDialog } from '../../../shared/confirmation-dialog/confirmation-dialog';
import { openDropdownOptionsDialog } from '../dropdown-options-dialog/dropdown-options-dialog';
import { openTextInputDialog } from '../../../shared/text-input-dialog/text-input-dialog';
import {
  CanvasElement,
  DropdownCanvasElement,
  TextCanvasElement,
  TextControlCanvasElement,
} from '../models/canvas-element';
import { cellLabel, CellPosition, GridCell } from '../models/grid-layout';
import { ELEMENT_LABELS, ElementType } from '../models/palette-item';
import { BuilderStore } from '../state/builder-store';

// Shown on hover and while focus is inside, so keyboard users get the same cue as mouse users.
const OUTLINE: Record<ElementType, string> = {
  div: 'border-dashed hover:border-primary/40 focus-within:border-primary/40',
  span: 'border-dotted hover:border-secondary focus-within:border-secondary',
  'text-input': 'border-dashed hover:border-info focus-within:border-info',
  textfield: 'border-dashed hover:border-info focus-within:border-info',
  datepicker: 'border-dashed hover:border-info focus-within:border-info',
  dropdown: 'border-dashed hover:border-accent focus-within:border-accent',
};

const isSameCell = (a: CellPosition, b: CellPosition): boolean =>
  a.row === b.row && a.column === b.column;

@Component({
  selector: 'dui-dropped-element',
  imports: [CdkMenuTrigger, CdkMenu, CdkMenuItem],
  templateUrl: './dropped-element.html',
  host: {
    class: 'group relative mb-2 cursor-grab rounded-box border border-transparent p-1 pr-10',
    '[class]': 'display() + " " + outline()',
    '[attr.data-uid]': 'element().uid',
    '[attr.data-element-type]': 'element().type',
  },
})
export class DroppedElement {
  readonly element = input.required<CanvasElement>();

  /** The element changed place and was re-rendered; the keyboard focus it held went with the old DOM. */
  readonly moved = output<void>();
  readonly removed = output<void>();

  protected readonly display = computed(() =>
    this.element().type === 'span' ? 'mr-2 inline-block align-top' : 'block',
  );
  protected readonly outline = computed(() => OUTLINE[this.element().type]);
  protected readonly actionsLabel = computed(() => `${ELEMENT_LABELS[this.element().type]} actions`);
  protected readonly cellLabel = cellLabel;

  private readonly store = inject(BuilderStore);
  private readonly dialog = inject(Dialog);
  private readonly actionsTrigger = viewChild.required<ElementRef<HTMLButtonElement>>('actionsTrigger');

  private readonly siblings = computed(() =>
    this.store.canvasElements().filter((other) => isSameCell(other, this.element())),
  );
  private readonly position = computed(() =>
    this.siblings().findIndex((other) => other.uid === this.element().uid),
  );
  protected readonly canReorder = computed(() => this.siblings().length > 1);
  protected readonly isFirst = computed(() => this.position() === 0);
  protected readonly isLast = computed(() => this.position() === this.siblings().length - 1);
  protected readonly otherCells = computed(() =>
    this.store.cells().filter((cell) => !isSameCell(cell, this.element())),
  );

  focusActions(): void {
    this.actionsTrigger().nativeElement.focus();
  }

  protected editText({ uid, type, text }: TextCanvasElement | TextControlCanvasElement): void {
    openTextInputDialog(this.dialog, {
      title: 'Edit text',
      description: `Change the text shown inside this <${type}>.`,
      value: text,
      restoreFocus: this.actionsTrigger().nativeElement,
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
      restoreFocus: this.actionsTrigger().nativeElement,
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

  protected moveWithinCell(offset: -1 | 1): void {
    const { uid, row, column } = this.element();
    this.store.moveElement(uid, { row, column }, this.position() + offset);
    this.moved.emit();
  }

  protected moveToCell(cell: GridCell): void {
    this.store.moveElement(this.element().uid, cell, cell.elements.length);
    this.moved.emit();
  }

  protected deleteElement(): void {
    const { uid, type } = this.element();
    openConfirmationDialog(this.dialog, {
      title: 'Delete element',
      description: `Remove this <${type}> from the canvas? This cannot be undone.`,
      confirmLabel: 'Delete',
      restoreFocus: this.actionsTrigger().nativeElement,
    }).subscribe((confirmed) => {
      if (confirmed) {
        this.store.removeElement(uid);
        this.removed.emit();
      }
    });
  }
}
