import { DialogConfig } from '@angular/cdk/dialog';

let nextDialogId = 0;

export const dialogTitleId = (dialogId: string): string => `${dialogId}-title`;
export const dialogDescriptionId = (dialogId: string): string => `${dialogId}-description`;

export interface DialogLabellingOptions {
  /** Whether the dialog renders a description; an id that matches nothing must not be referenced. */
  hasDescription: boolean;
  /** Where focus goes when the dialog closes, for an opener that is gone by then (a menu item). */
  restoreFocus?: HTMLElement;
}

/**
 * Names a dialog by its visible heading and describes it by its visible description, so screen
 * readers announce the text sighted users read. The dialog's component derives the same ids from
 * its `DialogRef.id`.
 */
export function labelledDialogConfig({
  hasDescription,
  restoreFocus,
}: DialogLabellingOptions): Pick<
  DialogConfig,
  'id' | 'ariaLabelledBy' | 'ariaDescribedBy' | 'restoreFocus'
> {
  const id = `dui-dialog-${nextDialogId++}`;
  return {
    id,
    ariaLabelledBy: dialogTitleId(id),
    ariaDescribedBy: hasDescription ? dialogDescriptionId(id) : null,
    restoreFocus: restoreFocus ?? true,
  };
}
