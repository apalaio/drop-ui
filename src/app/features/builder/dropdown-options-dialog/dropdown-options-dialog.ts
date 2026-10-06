import { Dialog, DialogRef } from '@angular/cdk/dialog';
import {
  afterNextRender,
  Component,
  ElementRef,
  inject,
  Injector,
  input,
  inputBinding,
  linkedSignal,
  viewChildren,
} from '@angular/core';
import { applyEach, form, FormField, FormRoot, validate } from '@angular/forms/signals';
import { Observable } from 'rxjs';
import {
  dialogDescriptionId,
  dialogTitleId,
  labelledDialogConfig,
} from '../../../shared/dialog-labelling';
import { DropdownOption } from '../models/dropdown-option';

const BLANK_OPTION: DropdownOption = { text: '', value: '' };

function copyOption({ text, value }: DropdownOption): DropdownOption {
  return { text, value };
}

@Component({
  selector: 'dui-dropdown-options-dialog',
  imports: [FormRoot, FormField],
  templateUrl: './dropdown-options-dialog.html',
  host: { class: 'block w-[min(36rem,90vw)] rounded-box bg-base-100 p-6 shadow-xl' },
})
export class DropdownOptionsDialog {
  readonly title = input.required<string>();
  readonly description = input('');
  readonly options = input<DropdownOption[]>([]);

  private readonly dialogRef = inject<DialogRef<DropdownOption[]>>(DialogRef);
  private readonly injector = inject(Injector);
  private readonly textInputs = viewChildren<ElementRef<HTMLInputElement>>('textInput');

  protected readonly titleId = dialogTitleId(this.dialogRef.id);
  protected readonly descriptionId = dialogDescriptionId(this.dialogRef.id);

  // Signal forms stamp a tracking symbol onto every array item, so the rows have to be the
  // dialog's own copies (the caller's may be frozen store state) and are copied again on the way out.
  protected readonly model = linkedSignal(() => ({
    options: this.options().length ? this.options().map(copyOption) : [copyOption(BLANK_OPTION)],
  }));
  protected readonly optionsForm = form(
    this.model,
    (path) =>
      applyEach(path.options, (option) => {
        validate(option.text, ({ value }) => (value().trim() ? undefined : { kind: 'blank' }));
        validate(option.value, ({ value }) => (value().trim() ? undefined : { kind: 'blank' }));
      }),
    {
      submission: {
        action: async () => this.dialogRef.close(this.model().options.map(copyOption)),
      },
    },
  );

  protected addOption(): void {
    this.model.update(({ options }) => ({ options: [...options, copyOption(BLANK_OPTION)] }));
    this.focusRow(this.model().options.length - 1);
  }

  protected removeOption(index: number): void {
    this.model.update(({ options }) => ({ options: options.filter((_, i) => i !== index) }));
    this.focusRow(index - 1);
  }

  protected cancel(): void {
    this.dialogRef.close();
  }

  private focusRow(index: number): void {
    afterNextRender(() => this.textInputs()[index]?.nativeElement.focus(), {
      injector: this.injector,
    });
  }
}

export interface DropdownOptionsDialogOptions {
  title: string;
  description?: string;
  options?: DropdownOption[];
  /** Element to focus once the dialog closes; defaults to whatever had focus when it opened. */
  restoreFocus?: HTMLElement;
}

export function openDropdownOptionsDialog(
  dialog: Dialog,
  { title, description = '', options = [], restoreFocus }: DropdownOptionsDialogOptions,
): Observable<DropdownOption[] | undefined> {
  return dialog.open<DropdownOption[]>(DropdownOptionsDialog, {
    ...labelledDialogConfig({ hasDescription: !!description, restoreFocus }),
    bindings: [
      inputBinding('title', () => title),
      inputBinding('description', () => description),
      inputBinding('options', () => options),
    ],
  }).closed;
}
