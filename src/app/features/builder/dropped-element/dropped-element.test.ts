import { fireEvent, render, screen } from '@testing-library/angular';
import { CanvasElement } from '../models/canvas-element';
import { DroppedElement } from './dropped-element';

describe(DroppedElement.name, () => {
  const uid = 'element-1';
  const text = 'enter text';
  const cell = { row: 0, column: 0 };
  const div: CanvasElement = { uid, type: 'div', paletteUid: 'palette-div', text, ...cell };
  const span: CanvasElement = { uid: 'element-2', type: 'span', paletteUid: 'palette-span', text, ...cell };
  const textInput: CanvasElement = { ...div, uid: 'element-4', type: 'text-input', paletteUid: 'palette-text-input' };
  const textfield: CanvasElement = { ...div, uid: 'element-5', type: 'textfield', paletteUid: 'palette-textfield' };
  const datepicker: CanvasElement = { uid: 'element-6', type: 'datepicker', paletteUid: 'palette-datepicker', ...cell };
  const formControlTestIds = ['dropped-text-input', 'dropped-textfield', 'dropped-datepicker'];
  const otherTestIds = (testId: string) =>
    ['dropped-div', 'dropped-span', 'dropped-dropdown', ...formControlTestIds].filter((other) => other !== testId);
  const small = { text: 'Small', value: 's' };
  const large = { text: 'Large', value: 'l' };
  const dropdown: CanvasElement = {
    uid: 'element-3',
    type: 'dropdown',
    paletteUid: 'palette-dropdown',
    options: [small, large],
    ...cell,
  };

  async function mount(element: CanvasElement) {
    return render(DroppedElement, { inputs: { element } });
  }

  it('should tag the wrapper with the element uid', async () => {
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

    it.each(formControlTestIds)('should not render %s', (testId) => {
      expect(screen.queryByTestId(testId)).not.toBeInTheDocument();
    });

    it('should not render a span', () => {
      expect(screen.queryByTestId('dropped-span')).not.toBeInTheDocument();
    });

    it('should not render a dropdown', () => {
      expect(screen.queryByTestId('dropped-dropdown')).not.toBeInTheDocument();
    });
  });

  describe('span element', () => {
    beforeEach(async () => mount(span));

    it('should render a span with the element text', () => {
      expect(screen.getByTestId('dropped-span')).toHaveTextContent(text);
    });

    it.each(formControlTestIds)('should not render %s', (testId) => {
      expect(screen.queryByTestId(testId)).not.toBeInTheDocument();
    });

    it('should not render a div', () => {
      expect(screen.queryByTestId('dropped-div')).not.toBeInTheDocument();
    });

    it('should not render a dropdown', () => {
      expect(screen.queryByTestId('dropped-dropdown')).not.toBeInTheDocument();
    });
  });

  describe('text input element', () => {
    beforeEach(async () => mount(textInput));

    it('should render a single-line text input', () => {
      expect(screen.getByTestId('dropped-text-input')).toBe(screen.getByRole('textbox', { name: 'Text input' }));
    });

    it('should show the element text as the placeholder', () => {
      expect(screen.getByRole('textbox', { name: 'Text input' })).toHaveAttribute('placeholder', text);
    });

    it.each(otherTestIds('dropped-text-input'))('should not render %s', (testId) => {
      expect(screen.queryByTestId(testId)).not.toBeInTheDocument();
    });
  });

  describe('textfield element', () => {
    beforeEach(async () => mount(textfield));

    it('should render a multi-line textarea', () => {
      expect(screen.getByRole('textbox', { name: 'Textfield' })).toBeInstanceOf(HTMLTextAreaElement);
    });

    it('should show the element text as the placeholder', () => {
      expect(screen.getByTestId('dropped-textfield')).toHaveAttribute('placeholder', text);
    });

    it.each(otherTestIds('dropped-textfield'))('should not render %s', (testId) => {
      expect(screen.queryByTestId(testId)).not.toBeInTheDocument();
    });
  });

  describe('datepicker element', () => {
    beforeEach(async () => mount(datepicker));

    it('should render a native date input', () => {
      expect(screen.getByLabelText('Datepicker')).toHaveAttribute('type', 'date');
    });

    it.each(otherTestIds('dropped-datepicker'))('should not render %s', (testId) => {
      expect(screen.queryByTestId(testId)).not.toBeInTheDocument();
    });
  });

  describe('dropdown element', () => {
    describe('with options', () => {
      beforeEach(async () => mount(dropdown));

      it('should render a select', () => {
        expect(screen.getByTestId('dropped-dropdown')).toBe(screen.getByRole('combobox', { name: 'Dropdown' }));
      });

      it('should render one option per element option, in order', () => {
        const labels = screen.getAllByRole('option').map((option) => option.textContent?.trim());

        expect(labels).toEqual([small.text, large.text]);
      });

      it('should give each option its value', () => {
        expect(screen.getByRole('option', { name: large.text })).toHaveValue(large.value);
      });

      it.each(formControlTestIds)('should not render %s', (testId) => {
        expect(screen.queryByTestId(testId)).not.toBeInTheDocument();
      });

      it('should not render a div', () => {
        expect(screen.queryByTestId('dropped-div')).not.toBeInTheDocument();
      });

      it('should not render a span', () => {
        expect(screen.queryByTestId('dropped-span')).not.toBeInTheDocument();
      });
    });

    describe('without options', () => {
      beforeEach(async () => mount({ ...dropdown, options: [] }));

      it('should render a select with no options', () => {
        expect(screen.getByRole('combobox', { name: 'Dropdown' })).toBeInTheDocument();
        expect(screen.queryAllByRole('option').length).toBe(0);
      });
    });
  });

  describe('actions menu of a datepicker', () => {
    beforeEach(async () => mount(datepicker));

    it('should not offer edit text, as a date input shows no text', async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Element actions' }));

      await screen.findByRole('menu');
      const actions = screen.getAllByRole('menuitem').map((item) => item.textContent?.trim());

      expect(actions).toEqual(['Delete element']);
    });
  });

  describe('actions menu of a dropdown', () => {
    beforeEach(async () => mount(dropdown));

    it('should list edit options then delete element, without edit text', async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Element actions' }));

      await screen.findByRole('menu');
      const actions = screen.getAllByRole('menuitem').map((item) => item.textContent?.trim());

      expect(actions).toEqual(['Edit options', 'Delete element']);
    });

    it('should open the edit options dialog, prefilled with the element options, from the edit options action', async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Element actions' }));
      fireEvent.click(await screen.findByRole('menuitem', { name: 'Edit options' }));

      const dialog = await screen.findByRole('dialog', { name: 'Edit options' });

      expect(dialog).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: 'Option 1 text' })).toHaveValue(small.text);
      expect(screen.getByRole('textbox', { name: 'Option 1 value' })).toHaveValue(small.value);
      expect(screen.getByRole('textbox', { name: 'Option 2 text' })).toHaveValue(large.text);
      expect(screen.getByRole('textbox', { name: 'Option 2 value' })).toHaveValue(large.value);
    });
  });

  describe('actions menu', () => {
    beforeEach(async () => mount(div));

    it('should list edit text then delete element when the actions button is clicked', async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Element actions' }));

      await screen.findByRole('menu');
      const actions = screen.getAllByRole('menuitem').map((item) => item.textContent?.trim());

      expect(actions).toEqual(['Edit text', 'Delete element']);
    });

    it('should open the delete confirmation from the delete element action', async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Element actions' }));
      fireEvent.click(await screen.findByRole('menuitem', { name: 'Delete element' }));

      const dialog = await screen.findByRole('dialog', { name: 'Delete element' });

      expect(dialog).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
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
