import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { ConfirmationDialogComponent, openConfirmationDialog } from './confirmation-dialog';

describe('ConfirmationDialogComponent', () => {
  let dialogRef: { close: ReturnType<typeof vi.fn> };
  let dialog: ConfirmationDialogComponent;

  beforeEach(() => {
    dialogRef = { close: vi.fn() };
    TestBed.configureTestingModule({ providers: [{ provide: DialogRef, useValue: dialogRef }] });
    const fixture = TestBed.createComponent(ConfirmationDialogComponent);
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

  it('opens the dialog with the given inputs, labelled by its title', () => {
    const { open } = openWith(of(undefined));

    const [component, config] = open.mock.calls[0] as unknown as [unknown, { ariaLabel: string; bindings: unknown[] }];
    expect(component).toBe(ConfirmationDialogComponent);
    expect(config.ariaLabel).toBe('Delete element');
    expect(config.bindings).toHaveLength(3);
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
