import { dialogDescriptionId, dialogTitleId, labelledDialogConfig } from './dialog-labelling';

describe('labelledDialogConfig', () => {
  it('labels the dialog by the title id its component derives from the dialog id', () => {
    const { id, ariaLabelledBy } = labelledDialogConfig({ hasDescription: true });

    expect(ariaLabelledBy).toBe(dialogTitleId(id!));
  });

  it('describes the dialog by its description id when it has a description', () => {
    const { id, ariaDescribedBy } = labelledDialogConfig({ hasDescription: true });

    expect(ariaDescribedBy).toBe(dialogDescriptionId(id!));
  });

  it('references no description when the dialog has none', () => {
    expect(labelledDialogConfig({ hasDescription: false }).ariaDescribedBy).toBeNull();
  });

  it('gives every dialog its own id', () => {
    const first = labelledDialogConfig({ hasDescription: false });
    const second = labelledDialogConfig({ hasDescription: false });

    expect(second.id).not.toBe(first.id);
  });

  it('returns focus to whatever had it by default', () => {
    expect(labelledDialogConfig({ hasDescription: false }).restoreFocus).toBe(true);
  });

  it('returns focus to the given element', () => {
    const restoreFocus = document.createElement('button');

    expect(labelledDialogConfig({ hasDescription: false, restoreFocus }).restoreFocus).toBe(restoreFocus);
  });
});
