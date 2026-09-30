import { render, screen } from '@testing-library/angular';
import { CanvasElement } from '../models/canvas-element';
import { DroppedElement } from './dropped-element';

describe(DroppedElement.name, () => {
  const uid = 'element-1';
  const div: CanvasElement = { uid, type: 'div', paletteUid: 'palette-div' };
  const span: CanvasElement = { uid: 'element-2', type: 'span', paletteUid: 'palette-span' };

  async function mount(element: CanvasElement) {
    return render(DroppedElement, { inputs: { element } });
  }

  it('should tag the wrapper with the element uid', async () => {
    // For a component render, the container is the component's host element: the wrapper itself.
    const { container } = await mount(div);

    expect(container).toHaveAttribute('data-uid', uid);
  });

  it('should tag the wrapper with the element type', async () => {
    const { container } = await mount(span);

    expect(container).toHaveAttribute('data-element-type', 'span');
  });

  describe('div element', () => {
    beforeEach(async () => mount(div));

    it('should render a div', () => {
      expect(screen.getByTestId('dropped-div')).toBeInTheDocument();
    });

    it('should not render a span', () => {
      expect(screen.queryByTestId('dropped-span')).not.toBeInTheDocument();
    });
  });

  describe('span element', () => {
    beforeEach(async () => mount(span));

    it('should render a span', () => {
      expect(screen.getByTestId('dropped-span')).toBeInTheDocument();
    });

    it('should not render a div', () => {
      expect(screen.queryByTestId('dropped-div')).not.toBeInTheDocument();
    });
  });
});
