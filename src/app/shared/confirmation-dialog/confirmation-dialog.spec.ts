import { Dialog, DialogConfig, DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { ConfirmationDialog, openConfirmationDialog } from './confirmation-dialog';

describe('ConfirmationDialog', () => {
  let dialogRef: { close: ReturnType<typeof vi.fn> };
  let dialog: ConfirmationDialog;

  beforeEach(() => {
    dialogRef = { close: vi.fn() };
    TestBed.configureTestingModule({ providers: [{ provide: DialogRef, useValue: dialogRef }] });
    const fixture = TestBed.createComponent(ConfirmationDialog);
    fixture.componentRef.setInput('title', 'Delete element');
    dialog = fixture.componentInstance;
  });

  it('closes with true on confirm', () => {
    dialog['confirm']();

    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('closes without a result on cancel', () => {
    dialog['cancel']();

    expect(dialogRef.close).toHaveBeenCalledWith();
  });
});

describe('openConfirmationDialog', () => {
  function openWith(closed: Observable<true | undefined>) {
    const open = vi.fn(() => ({ closed }));
    const result = openConfirmationDialog({ open } as unknown as Dialog, {
      title: 'Delete element',
      description: 'Sure?',
      confirmLabel: 'Delete',
    });
    return { open, result };
  }

  function configOf(open: ReturnType<typeof vi.fn>): DialogConfig & { bindings: unknown[] } {
    return (open.mock.calls[0] as unknown[])[1] as DialogConfig & { bindings: unknown[] };
  }

  it('opens the dialog with the given inputs', () => {
    const { open } = openWith(of(undefined));

    expect((open.mock.calls[0] as unknown[])[0]).toBe(ConfirmationDialog);
    expect(configOf(open).bindings).toHaveLength(3);
  });

  it('opens as an alert dialog, labelled by its title and described by its description', () => {
    const { open } = openWith(of(undefined));
    const { id, role, ariaLabelledBy, ariaDescribedBy } = configOf(open);

    expect(role).toBe('alertdialog');
    expect(ariaLabelledBy).toBe(`${id}-title`);
    expect(ariaDescribedBy).toBe(`${id}-description`);
  });

  it('returns focus to the element that had it unless told otherwise', () => {
    const { open } = openWith(of(undefined));

    expect(configOf(open).restoreFocus).toBe(true);
  });

  it('returns focus to the given element', () => {
    const open = vi.fn(() => ({ closed: of(undefined) }));
    const restoreFocus = document.createElement('button');

    openConfirmationDialog({ open } as unknown as Dialog, { title: 'Delete element', restoreFocus });

    expect(configOf(open).restoreFocus).toBe(restoreFocus);
  });

  it('emits true when the user confirmed', () => {
    const next = vi.fn();

    openWith(of(true)).result.subscribe(next);

    expect(next).toHaveBeenCalledWith(true);
  });

  it('emits false when the dialog closed without confirming', () => {
    const next = vi.fn();

    openWith(of(undefined)).result.subscribe(next);

    expect(next).toHaveBeenCalledWith(false);
  });
});
