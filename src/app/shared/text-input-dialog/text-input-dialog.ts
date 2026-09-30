import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { Component, inject, input, inputBinding, linkedSignal } from '@angular/core';
import { Observable } from 'rxjs';

/** Modal asking the user for a single line of text. Closes with the entered text on save, `undefined` on cancel. */
@Component({
  selector: 'dui-text-input-dialog',
  templateUrl: './text-input-dialog.html',
  host: { class: 'block w-[min(28rem,90vw)] rounded-box bg-base-100 p-6 shadow-xl' },
})
export class TextInputDialogComponent {
  readonly title = input.required<string>();
  readonly description = input('');
  /** Initial content of the text input. */
  readonly value = input('');

  protected readonly text = linkedSignal(() => this.value());
  private readonly dialogRef = inject<DialogRef<string>>(DialogRef);

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected save(): void {
    this.dialogRef.close(this.text());
  }
}

export interface TextInputDialogOptions {
  title: string;
  description?: string;
  value?: string;
}

/**
 * Opens a {@link TextInputDialogComponent}.
 * @returns Emits once on close: the entered text on save, `undefined` on cancel or backdrop click.
 */
export function openTextInputDialog(
  dialog: Dialog,
  { title, description = '', value = '' }: TextInputDialogOptions,
): Observable<string | undefined> {
  return dialog.open<string>(TextInputDialogComponent, {
    ariaLabel: title,
    bindings: [
      inputBinding('title', () => title),
      inputBinding('description', () => description),
      inputBinding('value', () => value),
    ],
  }).closed;
}
