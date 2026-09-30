import { signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { PaletteItem } from '../models/palette-item';
import { BuilderStore } from '../state/builder-store';
import { ElementPalette } from './element-palette';

describe(ElementPalette.name, () => {
  const divItem: PaletteItem = { uid: 'palette-div', type: 'div', label: 'Div' };

  async function mount(paletteItems: PaletteItem[]) {
    return render(ElementPalette, {
      providers: [{ provide: BuilderStore, useValue: { paletteItems: signal(paletteItems) } }],
    });
  }

  describe('with palette items', () => {
    beforeEach(async () => mount([divItem, { ...divItem, uid: 'palette-div-2' }]));

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
  });

  describe('without palette items', () => {
    beforeEach(async () => mount([]));

    it('should render no list items', () => {
      expect(screen.queryAllByRole('listitem').length).toBe(0);
    });
  });
});
