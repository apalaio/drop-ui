import { DialogRef } from '@angular/cdk/dialog';
import { fireEvent, render, screen } from '@testing-library/angular';
import { TextInputDialogComponent } from './text-input-dialog';

describe(TextInputDialogComponent.name, () => {
  const title = 'Edit text';
  const description = 'Change the text.';
  const value = 'enter text';

  async function mount(inputs: { description?: string; value?: string } = {}) {
    return render(TextInputDialogComponent, {
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
});
