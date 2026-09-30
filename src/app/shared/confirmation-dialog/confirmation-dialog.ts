import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { Component, inject, input, inputBinding } from '@angular/core';
import { map, Observable } from 'rxjs';

/** Modal asking the user to confirm an action. Closes with `true` on confirm, `undefined` on cancel. */
@Component({
  selector: 'dui-confirmation-dialog',
  templateUrl: './confirmation-dialog.html',
  host: { class: 'block w-[min(28rem,90vw)] rounded-box bg-base-100 p-6 shadow-xl' },
})
export class ConfirmationDialogComponent {
  readonly title = input.required<string>();
  readonly description = input('');
  readonly confirmLabel = input('Save');

  private readonly dialogRef = inject<DialogRef<true>>(DialogRef);

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected confirm(): void {
    this.dialogRef.close(true);
  }
}

export interface ConfirmationDialogOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
}

/**
 * Opens a {@link ConfirmationDialogComponent}.
 * @returns Emits once on close: `true` if the user confirmed, `false` on cancel or backdrop click.
 */
export function openConfirmationDialog(
  dialog: Dialog,
  { title, description = '', confirmLabel = 'Save' }: ConfirmationDialogOptions,
): Observable<boolean> {
  return dialog
    .open<true>(ConfirmationDialogComponent, {
      ariaLabel: title,
      bindings: [
        inputBinding('title', () => title),
        inputBinding('description', () => description),
        inputBinding('confirmLabel', () => confirmLabel),
      ],
    })
    .closed.pipe(map((result) => result === true));
}
