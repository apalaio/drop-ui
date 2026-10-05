import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { Component, inject, signal } from '@angular/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/angular';
import { DropdownOption } from '../models/dropdown-option';
import { DropdownOptionsDialog, openDropdownOptionsDialog } from './dropdown-options-dialog';

const title = 'Dropdown options';
const cancelled = 'cancelled';
const small: DropdownOption = { text: 'Small', value: 's' };
const large: DropdownOption = { text: 'Large', value: 'l' };

@Component({
  selector: 'dui-dropdown-options-dialog-host',
  template: `
    <button type="button" (click)="open()">Open</button>
    <output>{{ result() }}</output>
  `,
})
class DialogHost {
  private readonly dialog = inject(Dialog);
  protected readonly result = signal('');

  protected open(): void {
    openDropdownOptionsDialog(this.dialog, { title, options: [small] }).subscribe((options) =>
      this.result.set(options ? JSON.stringify(options) : cancelled),
    );
  }
}

describe(DropdownOptionsDialog.name, () => {
  const description = 'Add the options of this dropdown.';

  async function mount(inputs: { description?: string; options?: DropdownOption[] } = {}) {
    return render(DropdownOptionsDialog, {
      inputs: { title, ...inputs },
      providers: [{ provide: DialogRef, useValue: { close: () => undefined } }],
    });
  }

  it('should render the title', async () => {
    await mount();

    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
  });

  describe('description', () => {
    it('should render when given', async () => {
      await mount({ description });

      expect(screen.getByText(description)).toBeInTheDocument();
    });

    it('should not render when empty', async () => {
      await mount();

      expect(screen.queryByTestId('dialog-description')).not.toBeInTheDocument();
    });
  });

  describe('option rows', () => {
    it('should start with one blank row when no options are given', async () => {
      await mount();

      expect(screen.getAllByRole('textbox').length).toBe(2);
      expect(screen.getByRole('textbox', { name: 'Option 1 text' })).toHaveValue('');
      expect(screen.getByRole('textbox', { name: 'Option 1 value' })).toHaveValue('');
    });

    it('should render a row for every given option', async () => {
      await mount({ options: [small, large] });

      expect(screen.getAllByRole('textbox').length).toBe(4);
    });

    it('should prefill the text input with the option text', async () => {
      await mount({ options: [small, large] });

      expect(screen.getByRole('textbox', { name: 'Option 2 text' })).toHaveValue(large.text);
    });

    it('should prefill the value input with the option value', async () => {
      await mount({ options: [small, large] });

      expect(screen.getByRole('textbox', { name: 'Option 2 value' })).toHaveValue(large.value);
    });
  });

  describe('delete button', () => {
    beforeEach(async () => mount({ options: [small, large] }));

    it('should be disabled for the first row', () => {
      expect(screen.getByRole('button', { name: 'Delete option 1' })).toBeDisabled();
    });

    it('should be enabled for the other rows', () => {
      expect(screen.getByRole('button', { name: 'Delete option 2' })).toBeEnabled();
    });

    it('should remove its row when clicked', async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Delete option 2' }));

      await waitFor(() =>
        expect(screen.queryByRole('textbox', { name: 'Option 2 text' })).not.toBeInTheDocument(),
      );
      expect(screen.getByRole('textbox', { name: 'Option 1 text' })).toHaveValue(small.text);
    });

    it('should move focus to the text input of the previous row when clicked', async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Delete option 2' }));

      await waitFor(() =>
        expect(screen.getByRole('textbox', { name: 'Option 1 text' })).toHaveFocus(),
      );
    });
  });

  describe('add option button', () => {
    beforeEach(async () => {
      await mount({ options: [small] });
      fireEvent.click(screen.getByRole('button', { name: 'Add option' }));
    });

    it('should append a blank row when clicked', async () => {
      expect(await screen.findByRole('textbox', { name: 'Option 2 text' })).toHaveValue('');
      expect(screen.getByRole('textbox', { name: 'Option 2 value' })).toHaveValue('');
    });

    it('should focus the text input of the new row when clicked', async () => {
      await waitFor(() =>
        expect(screen.getByRole('textbox', { name: 'Option 2 text' })).toHaveFocus(),
      );
    });
  });

  describe('save button', () => {
    it('should be enabled when every row has a text and a value', async () => {
      await mount({ options: [small, large] });

      expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
    });

    it('should be disabled when a text is blank', async () => {
      await mount({ options: [small] });

      fireEvent.input(screen.getByRole('textbox', { name: 'Option 1 text' }), {
        target: { value: '   ' },
      });

      await waitFor(() => expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled());
    });

    it('should be disabled when a value is blank', async () => {
      await mount({ options: [small] });

      fireEvent.input(screen.getByRole('textbox', { name: 'Option 1 value' }), {
        target: { value: '   ' },
      });

      await waitFor(() => expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled());
    });
  });

  describe('when opened', () => {
    beforeEach(async () => {
      await render(DialogHost);
      fireEvent.click(screen.getByRole('button', { name: 'Open' }));
      await screen.findByRole('dialog', { name: title });
    });

    it('should focus the text input of the first row', async () => {
      await waitFor(() =>
        expect(screen.getByRole('textbox', { name: 'Option 1 text' })).toHaveFocus(),
      );
    });

    it('should close with the entered options when saved', async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Add option' }));
      fireEvent.input(await screen.findByRole('textbox', { name: 'Option 2 text' }), {
        target: { value: large.text },
      });
      fireEvent.input(screen.getByRole('textbox', { name: 'Option 2 value' }), {
        target: { value: large.value },
      });
      await waitFor(() => expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled());
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(screen.getByRole('status')).toHaveTextContent(JSON.stringify([small, large]));
    });

    it('should close without a result when cancelled', async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(screen.getByRole('status')).toHaveTextContent(cancelled);
    });
  });
});
