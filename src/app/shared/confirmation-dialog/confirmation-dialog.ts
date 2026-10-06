import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { Component, inject, input, inputBinding } from '@angular/core';
import { map, Observable } from 'rxjs';
import { dialogDescriptionId, dialogTitleId, labelledDialogConfig } from '../dialog-labelling';

/** Label of the confirm button when the caller gives none. */
export const DEFAULT_CONFIRM_LABEL = 'Confirm';

@Component({
  selector: 'dui-confirmation-dialog',
  templateUrl: './confirmation-dialog.html',
  host: { class: 'block w-[min(28rem,90vw)] rounded-box bg-base-100 p-6 shadow-xl' },
})
export class ConfirmationDialog {
  readonly title = input.required<string>();
  readonly description = input('');
  readonly confirmLabel = input(DEFAULT_CONFIRM_LABEL);

  private readonly dialogRef = inject<DialogRef<true>>(DialogRef);

  protected readonly titleId = dialogTitleId(this.dialogRef.id);
  protected readonly descriptionId = dialogDescriptionId(this.dialogRef.id);

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
  /** Element to focus once the dialog closes; defaults to whatever had focus when it opened. */
  restoreFocus?: HTMLElement;
}

export function openConfirmationDialog(
  dialog: Dialog,
  {
    title,
    description = '',
    confirmLabel = DEFAULT_CONFIRM_LABEL,
    restoreFocus,
  }: ConfirmationDialogOptions,
): Observable<boolean> {
  return dialog
    .open<true>(ConfirmationDialog, {
      ...labelledDialogConfig({ hasDescription: !!description, restoreFocus }),
      // It interrupts to ask about something that cannot be undone, which is what an alert dialog is.
      role: 'alertdialog',
      bindings: [
        inputBinding('title', () => title),
        inputBinding('description', () => description),
        inputBinding('confirmLabel', () => confirmLabel),
      ],
    })
    .closed.pipe(map((result) => result === true));
}
