import { signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { CanvasElement } from '../models/canvas-element';
import { BuilderStore } from '../state/builder-store';
import { Canvas } from './canvas';

describe(Canvas.name, () => {
  const dropHint = 'Drop elements here';
  const first: CanvasElement = { uid: 'element-1', type: 'div', paletteUid: 'palette-div', text: 'enter text' };
  const second: CanvasElement = { uid: 'element-2', type: 'div', paletteUid: 'palette-div', text: 'enter text' };

  async function mount(canvasElements: CanvasElement[]) {
    return render(Canvas, {
      providers: [{ provide: BuilderStore, useValue: { canvasElements: signal(canvasElements) } }],
    });
  }

  describe('with dropped elements', () => {
    beforeEach(async () => mount([second, first]));

    it('should render the elements in store order', () => {
      const uids = screen.getAllByTestId('dropped-div').map((div) => div.parentElement?.dataset['uid']);

      expect(uids).toEqual([second.uid, first.uid]);
    });

    it('should not render the drop hint', () => {
      expect(screen.queryByText(dropHint)).not.toBeInTheDocument();
    });
  });

  describe('without dropped elements', () => {
    beforeEach(async () => mount([]));

    it('should render the drop hint', () => {
      expect(screen.getByText(dropHint)).toBeInTheDocument();
    });

    it('should render no elements', () => {
      expect(screen.queryAllByTestId('dropped-div').length).toBe(0);
    });
  });
});
