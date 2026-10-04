import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { Component, inject, input, inputBinding, linkedSignal } from '@angular/core';
import { form, FormField, FormRoot, validate } from '@angular/forms/signals';
import { Observable } from 'rxjs';

@Component({
  selector: 'dui-text-input-dialog',
  imports: [FormRoot, FormField],
  templateUrl: './text-input-dialog.html',
  host: { class: 'block w-[min(28rem,90vw)] rounded-box bg-base-100 p-6 shadow-xl' },
})
export class TextInputDialog {
  readonly title = input.required<string>();
  readonly description = input('');
  readonly value = input('');

  private readonly dialogRef = inject<DialogRef<string>>(DialogRef);

  protected readonly model = linkedSignal(() => ({ text: this.value() }));
  protected readonly textForm = form(
    this.model,
    (path) => validate(path.text, ({ value }) => (value().trim() ? undefined : { kind: 'blank' })),
    { submission: { action: async () => this.dialogRef.close(this.model().text) } },
  );

  protected cancel(): void {
    this.dialogRef.close();
  }
}

export interface TextInputDialogOptions {
  title: string;
  description?: string;
  value?: string;
}

export function openTextInputDialog(
  dialog: Dialog,
  { title, description = '', value = '' }: TextInputDialogOptions,
): Observable<string | undefined> {
  return dialog.open<string>(TextInputDialog, {
    ariaLabel: title,
    bindings: [
      inputBinding('title', () => title),
      inputBinding('description', () => description),
      inputBinding('value', () => value),
    ],
  }).closed;
}
