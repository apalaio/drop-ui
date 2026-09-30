import { DialogRef } from '@angular/cdk/dialog';
import { render, screen } from '@testing-library/angular';
import { ConfirmationDialogComponent } from './confirmation-dialog';

describe(ConfirmationDialogComponent.name, () => {
  const title = 'Delete element';
  const description = 'This cannot be undone.';

  async function mount(inputs: { description?: string; confirmLabel?: string } = {}) {
    return render(ConfirmationDialogComponent, {
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

  describe('confirm button', () => {
    it('should be labelled Save by default', async () => {
      await mount();

      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    });

    it('should use the given label', async () => {
      await mount({ confirmLabel: 'Delete' });

      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });
  });
});
