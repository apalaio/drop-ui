import { render, screen } from '@testing-library/angular';
import { CanvasElement } from '../models/canvas-element';
import { DroppedElement } from './dropped-element';

describe(DroppedElement.name, () => {
  const uid = 'element-1';
  const element: CanvasElement = { uid, type: 'div', paletteUid: 'palette-1' };

  async function mount() {
    return render(DroppedElement, { inputs: { element } });
  }

  it('should tag the wrapper with the element uid', async () => {
    // For a component render, the container is the component's host element: the wrapper itself.
    const { container } = await mount();

    expect(container).toHaveAttribute('data-uid', uid);
  });

  it('should tag the wrapper with the element type', async () => {
    const { container } = await mount();

    expect(container).toHaveAttribute('data-element-type', 'div');
  });

  describe('div element', () => {
    it('should render a div', async () => {
      await mount();

      expect(screen.getByTestId('dropped-div')).toBeInTheDocument();
    });
  });
});
