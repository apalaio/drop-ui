import { computed, signal } from '@angular/core';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/angular';
import { CanvasElement } from '../models/canvas-element';
import { GridCell, GridLayout } from '../models/grid-layout';
import { BuilderStore } from '../state/builder-store';
import { Canvas } from './canvas';

describe(Canvas.name, () => {
  const dropHint = 'Drop elements here';
  const first: CanvasElement = {
    uid: 'element-1',
    type: 'div',
    paletteUid: 'palette-div',
    text: 'enter text',
    row: 0,
    column: 0,
  };
  const second: CanvasElement = { ...first, uid: 'element-2' };
  const third: CanvasElement = { ...first, uid: 'element-3' };

  function cell(row: number, column: number, elements: CanvasElement[] = []): GridCell {
    return { row, column, elements: elements.map((element) => ({ ...element, row, column })) };
  }

  async function mount(grid: GridLayout, cells: GridCell[]) {
    return render(Canvas, {
      providers: [{ provide: BuilderStore, useValue: { grid: signal(grid), cells: signal(cells) } }],
    });
  }

  function droppedUids(container: HTMLElement): (string | undefined)[] {
    return within(container)
      .queryAllByTestId('dropped-div')
      .map((div) => div.parentElement?.dataset['uid']);
  }

  describe('with a single cell', () => {
    const single: GridLayout = { rows: 1, columns: 1 };

    describe('with dropped elements', () => {
      beforeEach(async () => mount(single, [cell(0, 0, [second, first])]));

      it('should render one cell', () => {
        expect(screen.getAllByTestId('canvas-cell').length).toBe(1);
      });

      it('should render the elements in store order', () => {
        expect(droppedUids(screen.getByRole('group', { name: 'Row 1, column 1' }))).toEqual([second.uid, first.uid]);
      });

      it('should not render the drop hint', () => {
        expect(screen.queryByText(dropHint)).not.toBeInTheDocument();
      });
    });

    describe('without dropped elements', () => {
      beforeEach(async () => mount(single, [cell(0, 0)]));

      it('should render one cell', () => {
        expect(screen.getAllByTestId('canvas-cell').length).toBe(1);
      });

      it('should render the drop hint once', () => {
        expect(screen.getAllByText(dropHint).length).toBe(1);
      });

      it('should render no elements', () => {
        expect(screen.queryAllByTestId('dropped-div').length).toBe(0);
      });
    });
  });

  describe('with several cells', () => {
    const grid: GridLayout = { rows: 2, columns: 2 };
    const names = ['Row 1, column 1', 'Row 1, column 2', 'Row 2, column 1', 'Row 2, column 2'];

    describe('with dropped elements', () => {
      beforeEach(async () => mount(grid, [cell(0, 0), cell(0, 1, [second, first]), cell(1, 0, [third]), cell(1, 1)]));

      it('should render one cell per grid position', () => {
        expect(screen.getAllByTestId('canvas-cell').length).toBe(4);
      });

      it('should name the cells by their one-based row and column, row by row', () => {
        const labels = screen.getAllByRole('group').map((group) => group.getAttribute('aria-label'));

        expect(labels).toEqual(names);
      });

      it('should tag the cells with their zero-based row and column', () => {
        const positions = screen
          .getAllByTestId('canvas-cell')
          .map((canvasCell) => [canvasCell.dataset['row'], canvasCell.dataset['column']]);

        expect(positions).toEqual([
          ['0', '0'],
          ['0', '1'],
          ['1', '0'],
          ['1', '1'],
        ]);
      });

      it('should render each element inside its own cell, in store order', () => {
        const uids = names.map((name) => droppedUids(screen.getByRole('group', { name })));

        expect(uids).toEqual([[], [second.uid, first.uid], [third.uid], []]);
      });

      it('should render the drop hint in the empty cells only', () => {
        const hinted = names.filter((name) => within(screen.getByRole('group', { name })).queryByText(dropHint));

        expect(hinted).toEqual(['Row 1, column 1', 'Row 2, column 2']);
      });
    });

    describe('without dropped elements', () => {
      beforeEach(async () => mount(grid, [cell(0, 0), cell(0, 1), cell(1, 0), cell(1, 1)]));

      it('should render the drop hint in every cell', () => {
        expect(screen.getAllByText(dropHint).length).toBe(4);
      });

      it('should render no elements', () => {
        expect(screen.queryAllByTestId('dropped-div').length).toBe(0);
      });
    });
  });

  describe('keyboard focus', () => {
    const actions = 'Block text actions';
    const leftName = 'Row 1, column 1';
    const rightName = 'Row 1, column 2';

    beforeEach(async () => {
      const cells = signal([cell(0, 0, [first]), cell(0, 1)]);
      await render(Canvas, {
        providers: [
          {
            provide: BuilderStore,
            useValue: {
              grid: signal({ rows: 1, columns: 2 }),
              cells,
              canvasElements: computed(() => cells().flatMap((gridCell) => gridCell.elements)),
              moveElement: () => cells.set([cell(0, 0), cell(0, 1, [first])]),
              removeElement: () => cells.set([cell(0, 0), cell(0, 1)]),
            },
          },
        ],
      });
      fireEvent.click(screen.getByRole('button', { name: actions }));
      await screen.findByRole('menu', { name: actions });
    });

    it('should not make the cells tab stops', () => {
      const tabIndexes = screen.getAllByTestId('canvas-cell').map((canvasCell) => canvasCell.tabIndex);

      expect(tabIndexes).toEqual([-1, -1]);
    });

    it('should follow an element moved to another cell', async () => {
      fireEvent.click(screen.getByRole('menuitem', { name: 'Move to cell' }));
      fireEvent.click(await screen.findByRole('menuitem', { name: rightName }));

      const right = await screen.findByRole('group', { name: rightName });

      await waitFor(() => expect(within(right).getByRole('button', { name: actions })).toHaveFocus());
    });

    it('should move to the cell an element was deleted from', async () => {
      fireEvent.click(screen.getByRole('menuitem', { name: 'Delete element' }));
      await screen.findByRole('alertdialog', { name: 'Delete element' });

      fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

      await waitFor(() => expect(screen.getByRole('group', { name: leftName })).toHaveFocus());
    });
  });
});
