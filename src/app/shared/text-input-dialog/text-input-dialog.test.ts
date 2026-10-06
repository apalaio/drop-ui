import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { Component, inject, signal } from '@angular/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/angular';
import { openTextInputDialog, TextInputDialog } from './text-input-dialog';

const title = 'Edit text';
const description = 'Change the text.';
const value = 'enter text';
const cancelled = 'cancelled';

@Component({
  selector: 'dui-text-input-dialog-host',
  template: `
    <button type="button" (click)="open()">Open</button>
    <output>{{ result() }}</output>
  `,
})
class DialogHost {
  private readonly dialog = inject(Dialog);
  protected readonly result = signal('');

  protected open(): void {
    openTextInputDialog(this.dialog, { title, description, value }).subscribe((text) =>
      this.result.set(text ?? cancelled),
    );
  }
}

describe(TextInputDialog.name, () => {
  async function mount(inputs: { description?: string; value?: string } = {}) {
    return render(TextInputDialog, {
      inputs: { title, ...inputs },
      providers: [{ provide: DialogRef, useValue: { close: () => undefined } }],
    });
  }

  it('should render the title', async () => {
    await mount();

    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
  });

  it('should prefill the text input with the value', async () => {
    await mount({ value });

    expect(screen.getByRole('textbox', { name: 'Text' })).toHaveValue(value);
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

  describe('save button', () => {
    it('should be enabled when the input has text', async () => {
      await mount({ value });

      expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
    });

    it('should be disabled when the input is blank', async () => {
      await mount({ value });

      fireEvent.input(screen.getByRole('textbox', { name: 'Text' }), { target: { value: '   ' } });

      expect(await screen.findByRole('button', { name: 'Save' })).toBeDisabled();
    });
  });

  describe('when opened', () => {
    beforeEach(async () => {
      await render(DialogHost);
      fireEvent.click(screen.getByRole('button', { name: 'Open' }));
      await screen.findByRole('dialog', { name: title });
    });

    it('should be described by its description', () => {
      expect(screen.getByRole('dialog')).toHaveAccessibleDescription(description);
    });

    it('should start in the text input', async () => {
      await waitFor(() => expect(screen.getByRole('textbox', { name: 'Text' })).toHaveFocus());
    });

    it('should close with the entered text when saved', async () => {
      fireEvent.input(screen.getByRole('textbox', { name: 'Text' }), {
        target: { value: 'Hello' },
      });
      fireEvent.click(await screen.findByRole('button', { name: 'Save' }));

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(screen.getByRole('status')).toHaveTextContent('Hello');
    });

    it('should close without a result when cancelled', async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(screen.getByRole('status')).toHaveTextContent(cancelled);
    });
  });
});
