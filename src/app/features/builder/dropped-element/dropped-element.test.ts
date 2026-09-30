import { fireEvent, render, screen } from '@testing-library/angular';
import { CanvasElement } from '../models/canvas-element';
import { DroppedElement } from './dropped-element';

describe(DroppedElement.name, () => {
  const uid = 'element-1';
  const text = 'enter text';
  const div: CanvasElement = { uid, type: 'div', paletteUid: 'palette-div', text };
  const span: CanvasElement = { uid: 'element-2', type: 'span', paletteUid: 'palette-span', text };

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

    it('should render a div with the element text', () => {
      expect(screen.getByTestId('dropped-div')).toHaveTextContent(text);
    });

    it('should not render a span', () => {
      expect(screen.queryByTestId('dropped-span')).not.toBeInTheDocument();
    });
  });

  describe('span element', () => {
    beforeEach(async () => mount(span));

    it('should render a span with the element text', () => {
      expect(screen.getByTestId('dropped-span')).toHaveTextContent(text);
    });

    it('should not render a div', () => {
      expect(screen.queryByTestId('dropped-div')).not.toBeInTheDocument();
    });
  });

  describe('actions menu', () => {
    beforeEach(async () => mount(div));

    it('should open with an edit text action when the actions button is clicked', async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Element actions' }));

      expect(await screen.findByRole('menuitem', { name: 'Edit text' })).toBeInTheDocument();
    });

    it('should open the edit text dialog, prefilled with the element text, from the edit text action', async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Element actions' }));
      fireEvent.click(await screen.findByRole('menuitem', { name: 'Edit text' }));

      const dialog = await screen.findByRole('dialog', { name: 'Edit text' });

      expect(dialog).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: 'Text' })).toHaveValue(text);
    });
  });
});
