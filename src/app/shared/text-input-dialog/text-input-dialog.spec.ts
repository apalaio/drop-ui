import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { submit } from '@angular/forms/signals';
import { openTextInputDialog, TextInputDialog } from './text-input-dialog';

describe('TextInputDialog', () => {
  let dialogRef: { close: ReturnType<typeof vi.fn> };
  let dialog: TextInputDialog;

  beforeEach(() => {
    dialogRef = { close: vi.fn() };
    TestBed.configureTestingModule({ providers: [{ provide: DialogRef, useValue: dialogRef }] });
    const fixture = TestBed.createComponent(TextInputDialog);
    fixture.componentRef.setInput('title', 'Edit text');
    fixture.componentRef.setInput('value', 'enter text');
    dialog = fixture.componentInstance;
  });

  it('closes with the entered text on submit', async () => {
    dialog['model'].set({ text: 'Hello' });

    await submit(dialog['textForm']);

    expect(dialogRef.close).toHaveBeenCalledWith('Hello');
  });

  it('stays open when submitted with blank text', async () => {
    dialog['model'].set({ text: '   ' });

    await submit(dialog['textForm']);

    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('closes without a result on cancel', () => {
    dialog['cancel']();

    expect(dialogRef.close).toHaveBeenCalledWith();
  });
});

describe('openTextInputDialog', () => {
  it('opens the dialog with the given inputs, labelled by its title and described by its description', () => {
    const dialog = TestBed.inject(Dialog);
    const open = vi.spyOn(dialog, 'open');

    openTextInputDialog(dialog, { title: 'Edit text', description: 'Change it.', value: 'enter text' });

    const [component, config] = open.mock.calls[0];
    expect(component).toBe(TextInputDialog);
    expect(config?.ariaLabelledBy).toBe(`${config?.id}-title`);
    expect(config?.ariaDescribedBy).toBe(`${config?.id}-description`);
    expect(config?.bindings).toHaveLength(3);
    dialog.closeAll();
  });

  it('references no description when none is given', () => {
    const dialog = TestBed.inject(Dialog);
    const open = vi.spyOn(dialog, 'open');

    openTextInputDialog(dialog, { title: 'Edit text' });

    expect(open.mock.calls[0][1]?.ariaDescribedBy).toBeNull();
    dialog.closeAll();
  });

  it('returns focus to the given element', () => {
    const dialog = TestBed.inject(Dialog);
    const open = vi.spyOn(dialog, 'open');
    const restoreFocus = document.createElement('button');

    openTextInputDialog(dialog, { title: 'Edit text', restoreFocus });

    expect(open.mock.calls[0][1]?.restoreFocus).toBe(restoreFocus);
    dialog.closeAll();
  });
});
