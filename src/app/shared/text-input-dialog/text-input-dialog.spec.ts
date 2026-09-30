import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { openTextInputDialog, TextInputDialogComponent } from './text-input-dialog';

describe('TextInputDialogComponent', () => {
  let dialogRef: { close: ReturnType<typeof vi.fn> };
  let dialog: TextInputDialogComponent;

  beforeEach(() => {
    dialogRef = { close: vi.fn() };
    TestBed.configureTestingModule({ providers: [{ provide: DialogRef, useValue: dialogRef }] });
    const fixture = TestBed.createComponent(TextInputDialogComponent);
    fixture.componentRef.setInput('title', 'Edit text');
    fixture.componentRef.setInput('value', 'enter text');
    dialog = fixture.componentInstance;
  });

  it('closes with the entered text on save', () => {
    dialog['text'].set('Hello');

    dialog['save']();

    expect(dialogRef.close).toHaveBeenCalledWith('Hello');
  });

  it('closes without a result on cancel', () => {
    dialog['cancel']();

    expect(dialogRef.close).toHaveBeenCalledWith();
  });
});

describe('openTextInputDialog', () => {
  it('opens the dialog with the given inputs, labelled by its title', () => {
    const dialog = TestBed.inject(Dialog);
    const open = vi.spyOn(dialog, 'open');

    openTextInputDialog(dialog, { title: 'Edit text', description: 'Change it.', value: 'enter text' });

    const [component, config] = open.mock.calls[0];
    expect(component).toBe(TextInputDialogComponent);
    expect(config?.ariaLabel).toBe('Edit text');
    expect(config?.bindings).toHaveLength(3);
    dialog.closeAll();
  });
});
