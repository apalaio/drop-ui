import { signal } from '@angular/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/angular';
import { GridCell } from '../models/grid-layout';
import { PaletteItem } from '../models/palette-item';
import { BuilderStore } from '../state/builder-store';
import { ElementPalette } from './element-palette';

describe(ElementPalette.name, () => {
  const divItem: PaletteItem = { uid: 'palette-div', type: 'div', label: 'Div' };
  const addDiv = 'Add Div';
  const addDivTo = 'Add Div to';
  const singleCell: GridCell[] = [{ row: 0, column: 0, elements: [] }];

  async function mount(paletteItems: PaletteItem[], cells: GridCell[] = singleCell) {
    return render(ElementPalette, {
      providers: [
        {
          provide: BuilderStore,
          useValue: {
            paletteItems: signal(paletteItems),
            cells: signal(cells),
            addElement: () => undefined,
          },
        },
      ],
    });
  }

  describe('with palette items', () => {
    beforeEach(async () => mount([divItem, { ...divItem, uid: 'palette-div-2' }]));

    it('should name the list after its heading', () => {
      expect(screen.getByRole('list', { name: 'Elements' })).toBeInTheDocument();
    });

    it('should render one list item per palette item', () => {
      expect(screen.getAllByRole('listitem').length).toBe(2);
    });

    it('should render the item label', () => {
      expect(screen.getAllByText(divItem.label).length).toBe(2);
    });

    it('should tag each item with its uid', () => {
      const [first, second] = screen.getAllByRole('listitem');

      expect(first).toHaveAttribute('data-uid', 'palette-div');
      expect(second).toHaveAttribute('data-uid', 'palette-div-2');
    });

    it('should render every item as a button that adds it', () => {
      expect(screen.getAllByRole('button', { name: addDiv }).length).toBe(2);
    });

    it('should not show a cell menu until an item is activated', () => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  describe('without palette items', () => {
    beforeEach(async () => mount([]));

    it('should render no list items', () => {
      expect(screen.queryAllByRole('listitem').length).toBe(0);
    });
  });

  describe('when an item is activated', () => {
    const cells: GridCell[] = [
      { row: 0, column: 0, elements: [] },
      { row: 0, column: 1, elements: [] },
      { row: 1, column: 0, elements: [] },
      { row: 1, column: 1, elements: [] },
    ];

    beforeEach(async () => {
      await mount([divItem], cells);
      fireEvent.click(screen.getByRole('button', { name: addDiv }));
      await screen.findByRole('menu', { name: addDivTo });
    });

    it('should mark the item as expanded', () => {
      expect(screen.getByRole('button', { name: addDiv })).toHaveAttribute('aria-expanded', 'true');
    });

    it('should offer every cell of the grid, row by row', () => {
      const targets = screen.getAllByRole('menuitem').map((item) => item.textContent?.trim());

      expect(targets).toEqual(['Row 1, column 1', 'Row 1, column 2', 'Row 2, column 1', 'Row 2, column 2']);
    });

    it('should close the menu once a cell is picked', async () => {
      fireEvent.click(screen.getByRole('menuitem', { name: 'Row 2, column 1' }));

      await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    });

    it('should return focus to the item once a cell is picked', async () => {
      fireEvent.click(screen.getByRole('menuitem', { name: 'Row 2, column 1' }));

      await waitFor(() => expect(screen.getByRole('button', { name: addDiv })).toHaveFocus());
    });
  });

  describe('when an item is activated in a grid of one cell', () => {
    beforeEach(async () => {
      await mount([divItem]);
      fireEvent.click(screen.getByRole('button', { name: addDiv }));
      await screen.findByRole('menu', { name: addDivTo });
    });

    it('should offer that one cell', () => {
      expect(screen.getAllByRole('menuitem').length).toBe(1);
    });
  });
});
