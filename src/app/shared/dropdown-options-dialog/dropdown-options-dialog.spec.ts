import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { submit } from '@angular/forms/signals';
import { DropDownOptionsDialog, openDropDownOptionsDialog } from './dropdown-options-dialog';

describe('DropDownOptionsDialog', () => {
  let dialogRef: { close: ReturnType<typeof vi.fn> };
  let fixture: ComponentFixture<DropDownOptionsDialog>;
  let dialog: DropDownOptionsDialog;

  beforeEach(() => {
    dialogRef = { close: vi.fn() };
    TestBed.configureTestingModule({ providers: [{ provide: DialogRef, useValue: dialogRef }] });
    fixture = TestBed.createComponent(DropDownOptionsDialog);
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

describe('openDropDownOptionsDialog', () => {
  it('opens the dialog with the given inputs, labelled by its title', () => {
    const dialog = TestBed.inject(Dialog);
    const open = vi.spyOn(dialog, 'open');

    openDropDownOptionsDialog(dialog, {
      title: 'Dropdown options',
      subtitle: 'Add the options.',
      options: [{ text: 'Small', value: 's' }],
    });

    const [component, config] = open.mock.calls[0];
    expect(component).toBe(DropDownOptionsDialog);
    expect(config?.ariaLabel).toBe('Dropdown options');
    expect(config?.bindings).toHaveLength(3);
    dialog.closeAll();
  });
});
