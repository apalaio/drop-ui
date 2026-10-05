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
import { DropdownOption } from './dropdown-option';

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
export class DropDownOptionsDialog {
  readonly title = input.required<string>();
  readonly subtitle = input('');
  readonly options = input<DropdownOption[]>([]);

  private readonly dialogRef = inject<DialogRef<DropdownOption[]>>(DialogRef);
  private readonly injector = inject(Injector);
  private readonly textInputs = viewChildren<ElementRef<HTMLInputElement>>('textInput');

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
    // The clicked delete button is gone, which would otherwise drop focus out of the dialog.
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

export interface DropDownOptionsDialogOptions {
  title: string;
  subtitle?: string;
  /** Rows the dialog starts with; an empty/omitted list starts with one blank row. */
  options?: DropdownOption[];
}

export function openDropDownOptionsDialog(
  dialog: Dialog,
  { title, subtitle = '', options = [] }: DropDownOptionsDialogOptions,
): Observable<DropdownOption[] | undefined> {
  return dialog.open<DropdownOption[]>(DropDownOptionsDialog, {
    ariaLabel: title,
    bindings: [
      inputBinding('title', () => title),
      inputBinding('subtitle', () => subtitle),
      inputBinding('options', () => options),
    ],
  }).closed;
}
