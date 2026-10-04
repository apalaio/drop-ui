import { signal } from '@angular/core';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/angular';
import { GridLayout } from '../models/grid-layout';
import { BuilderStore } from '../state/builder-store';
import { LayoutPanel } from './layout-panel';

describe(LayoutPanel.name, () => {
  const rowsLabel = 'Grid rows';
  const columnsLabel = 'Grid columns';

  describe('with a grid in the store', () => {
    const grid: GridLayout = { rows: 3, columns: 4 };

    beforeEach(async () =>
      render(LayoutPanel, {
        providers: [
          {
            provide: BuilderStore,
            useValue: {
              grid: signal(grid),
              setGridSize: () => undefined,
            },
          },
        ],
      }),
    );

    it('should render the layout heading', () => {
      expect(screen.getByRole('heading', { name: 'Layout' })).toBeInTheDocument();
    });

    it('should list Grid as the only layout', () => {
      const entries = screen.getAllByRole('listitem');

      expect(entries.length).toBe(1);
      expect(entries[0]).toHaveTextContent('Grid');
    });

    it('should render the rows input before the columns input, inside the Grid entry', () => {
      const inputs = within(screen.getByRole('listitem')).getAllByRole('spinbutton');

      expect(inputs.map((input) => input.getAttribute('aria-label'))).toEqual([
        rowsLabel,
        columnsLabel,
      ]);
    });

    it('should show the grid rows in the rows input', () => {
      expect(screen.getByRole('spinbutton', { name: rowsLabel })).toHaveValue(grid.rows);
    });

    it('should show the grid columns in the columns input', () => {
      expect(screen.getByRole('spinbutton', { name: columnsLabel })).toHaveValue(grid.columns);
    });

    it.each([rowsLabel, columnsLabel])('should limit the %s input to 1 through 12', (label) => {
      const input = screen.getByRole('spinbutton', { name: label });

      expect(input).toHaveAttribute('min', '1');
      expect(input).toHaveAttribute('max', '12');
    });
  });

  describe.each([
    { label: rowsLabel, otherLabel: columnsLabel },
    { label: columnsLabel, otherLabel: rowsLabel },
  ])('editing the $label input', ({ label, otherLabel }) => {
    beforeEach(async () => render(LayoutPanel));

    function type(value: string): void {
      fireEvent.input(screen.getByRole('spinbutton', { name: label }), { target: { value } });
    }

    function leave(): void {
      const input = screen.getByRole('spinbutton', { name: label });
      fireEvent.change(input);
      fireEvent.blur(input);
    }

    it('should start at one', () => {
      expect(screen.getByRole('spinbutton', { name: label })).toHaveValue(1);
    });

    it('should keep a number within range after the field is left', async () => {
      type('5');
      leave();

      await waitFor(() => expect(screen.getByRole('spinbutton', { name: label })).toHaveValue(5));
    });

    it('should not change the other input', async () => {
      type('5');
      leave();

      await waitFor(() => expect(screen.getByRole('spinbutton', { name: label })).toHaveValue(5));
      expect(screen.getByRole('spinbutton', { name: otherLabel })).toHaveValue(1);
    });

    it('should show the maximum after a larger number is typed and the field is left', async () => {
      type('99');
      leave();

      await waitFor(() => expect(screen.getByRole('spinbutton', { name: label })).toHaveValue(12));
    });

    it('should show the minimum after a smaller number is typed and the field is left', async () => {
      type('0');
      leave();

      await waitFor(() => expect(screen.getByRole('spinbutton', { name: label })).toHaveValue(1));
    });

    it('should show the whole number after a fraction is typed and the field is left', async () => {
      type('2.9');
      leave();

      await waitFor(() => expect(screen.getByRole('spinbutton', { name: label })).toHaveValue(2));
    });

    it('should show the previous value again after the field is cleared and left', async () => {
      type('5');
      leave();
      type('');
      leave();

      await waitFor(() => expect(screen.getByRole('spinbutton', { name: label })).toHaveValue(5));
    });

    it('should show the maximum again when another too-large number is typed', async () => {
      type('99');
      leave();
      type('50');
      leave();

      await waitFor(() => expect(screen.getByRole('spinbutton', { name: label })).toHaveValue(12));
    });
  });
});
