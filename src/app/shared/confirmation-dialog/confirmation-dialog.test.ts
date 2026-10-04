import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { Component, inject, signal } from '@angular/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/angular';
import {
  ConfirmationDialog,
  DEFAULT_CONFIRM_LABEL,
  openConfirmationDialog,
} from './confirmation-dialog';

const title = 'Delete element';
const confirmLabel = 'Delete';

@Component({
  selector: 'dui-confirmation-dialog-host',
  template: `
    <button type="button" (click)="open()">Open</button>
    <output>{{ result() }}</output>
  `,
})
class DialogHost {
  private readonly dialog = inject(Dialog);
  protected readonly result = signal('');

  protected open(): void {
    openConfirmationDialog(this.dialog, { title, confirmLabel }).subscribe((confirmed) =>
      this.result.set(String(confirmed)),
    );
  }
}

describe(ConfirmationDialog.name, () => {
  const description = 'This cannot be undone.';

  async function mount(inputs: { description?: string; confirmLabel?: string } = {}) {
    return render(ConfirmationDialog, {
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
    it('should be labelled Confirm by default', async () => {
      await mount();

      expect(screen.getByRole('button', { name: DEFAULT_CONFIRM_LABEL })).toBeInTheDocument();
    });

    it('should use the given label', async () => {
      await mount({ confirmLabel });

      expect(screen.getByRole('button', { name: confirmLabel })).toBeInTheDocument();
    });
  });

  describe('when opened', () => {
    beforeEach(async () => {
      await render(DialogHost);
      fireEvent.click(screen.getByRole('button', { name: 'Open' }));
      await screen.findByRole('dialog', { name: title });
    });

    it('should close confirmed when the confirm button is clicked', async () => {
      fireEvent.click(screen.getByRole('button', { name: confirmLabel }));

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(screen.getByRole('status')).toHaveTextContent('true');
    });

    it('should close unconfirmed when cancelled', async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(screen.getByRole('status')).toHaveTextContent('false');
    });
  });
});
