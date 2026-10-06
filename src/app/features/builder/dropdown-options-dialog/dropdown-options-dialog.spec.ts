import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { submit } from '@angular/forms/signals';
import { DropdownOptionsDialog, openDropdownOptionsDialog } from './dropdown-options-dialog';

describe('DropdownOptionsDialog', () => {
  let dialogRef: { close: ReturnType<typeof vi.fn> };
  let fixture: ComponentFixture<DropdownOptionsDialog>;
  let dialog: DropdownOptionsDialog;

  beforeEach(() => {
    dialogRef = { close: vi.fn() };
    TestBed.configureTestingModule({ providers: [{ provide: DialogRef, useValue: dialogRef }] });
    fixture = TestBed.createComponent(DropdownOptionsDialog);
    fixture.componentRef.setInput('title', 'Dropdown options');
    dialog = fixture.componentInstance;
  });

  it('closes with the entered options on submit', async () => {
    dialog['model'].set({
      options: [
        { text: 'Small', value: 's' },
        { text: 'Large', value: 'l' },
      ],
    });

    await submit(dialog['optionsForm']);

    expect(dialogRef.close).toHaveBeenCalledWith([
      { text: 'Small', value: 's' },
      { text: 'Large', value: 'l' },
    ]);
  });

  it('closes with the given options when they are frozen', async () => {
    const options = Object.freeze([Object.freeze({ text: 'Small', value: 's' })]);
    fixture.componentRef.setInput('options', options);

    await submit(dialog['optionsForm']);

    expect(dialogRef.close).toHaveBeenCalledWith([{ text: 'Small', value: 's' }]);
  });

  it('stays open when submitted with a blank text', async () => {
    dialog['model'].set({ options: [{ text: '   ', value: 's' }] });

    await submit(dialog['optionsForm']);

    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('stays open when submitted with a blank value', async () => {
    dialog['model'].set({ options: [{ text: 'Small', value: '   ' }] });

    await submit(dialog['optionsForm']);

    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('stays open when submitted with the initial blank row', async () => {
    await submit(dialog['optionsForm']);

    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('closes without a result on cancel', () => {
    dialog['cancel']();

    expect(dialogRef.close).toHaveBeenCalledWith();
  });
});

describe('openDropdownOptionsDialog', () => {
  it('opens the dialog with the given inputs, labelled by its title and described by its description', () => {
    const dialog = TestBed.inject(Dialog);
    const open = vi.spyOn(dialog, 'open');

    openDropdownOptionsDialog(dialog, {
      title: 'Dropdown options',
      description: 'Add the options.',
      options: [{ text: 'Small', value: 's' }],
    });

    const [component, config] = open.mock.calls[0];
    expect(component).toBe(DropdownOptionsDialog);
    expect(config?.ariaLabelledBy).toBe(`${config?.id}-title`);
    expect(config?.ariaDescribedBy).toBe(`${config?.id}-description`);
    expect(config?.bindings).toHaveLength(3);
    dialog.closeAll();
  });

  it('references no description when none is given', () => {
    const dialog = TestBed.inject(Dialog);
    const open = vi.spyOn(dialog, 'open');

    openDropdownOptionsDialog(dialog, { title: 'Dropdown options' });

    expect(open.mock.calls[0][1]?.ariaDescribedBy).toBeNull();
    dialog.closeAll();
  });

  it('returns focus to the given element', () => {
    const dialog = TestBed.inject(Dialog);
    const open = vi.spyOn(dialog, 'open');
    const restoreFocus = document.createElement('button');

    openDropdownOptionsDialog(dialog, { title: 'Dropdown options', restoreFocus });

    expect(open.mock.calls[0][1]?.restoreFocus).toBe(restoreFocus);
    dialog.closeAll();
  });
});
