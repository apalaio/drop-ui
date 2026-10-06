import { signal } from '@angular/core';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/angular';
import {
  CanvasElement,
  DatepickerCanvasElement,
  DropdownCanvasElement,
  TextControlCanvasElement,
} from '../models/canvas-element';
import { GridCell } from '../models/grid-layout';
import { BuilderStore } from '../state/builder-store';
import { DroppedElement } from './dropped-element';

describe(DroppedElement.name, () => {
  const uid = 'element-1';
  const text = 'enter text';
  const cell = { row: 0, column: 0 };
  const div: CanvasElement = { uid, type: 'div', paletteUid: 'palette-div', text, ...cell };
  const span: CanvasElement = { uid: 'element-2', type: 'span', paletteUid: 'palette-span', text, ...cell };
  const typed = 'Ada';
  const pickedDate = '2026-10-05';
  const textInput: TextControlCanvasElement = {
    uid: 'element-4',
    type: 'text-input',
    paletteUid: 'palette-text-input',
    text,
    value: '',
    ...cell,
  };
  const textfield: TextControlCanvasElement = {
    ...textInput,
    uid: 'element-5',
    type: 'textfield',
    paletteUid: 'palette-textfield',
  };
  const datepicker: DatepickerCanvasElement = {
    uid: 'element-6',
    type: 'datepicker',
    paletteUid: 'palette-datepicker',
    value: '',
    ...cell,
  };
  const formControlTestIds = ['dropped-text-input', 'dropped-textfield', 'dropped-datepicker'];
  const otherTestIds = (testId: string) =>
    ['dropped-div', 'dropped-span', 'dropped-dropdown', ...formControlTestIds].filter((other) => other !== testId);
  const small = { text: 'Small', value: 's' };
  const large = { text: 'Large', value: 'l' };
  const dropdown: DropdownCanvasElement = {
    uid: 'element-3',
    type: 'dropdown',
    paletteUid: 'palette-dropdown',
    options: [small, large],
    value: small.value,
    ...cell,
  };

  const divActions = 'Block text actions';
  const dropdownActions = 'Dropdown actions';
  const moveEarlier = 'Move earlier';
  const moveLater = 'Move later';
  const moveToCell = 'Move to cell';

  async function mount(element: CanvasElement, canvas?: { canvasElements: CanvasElement[]; cells: GridCell[] }) {
    return render(DroppedElement, {
      inputs: { element },
      providers: canvas
        ? [
            {
              provide: BuilderStore,
              useValue: {
                canvasElements: signal(canvas.canvasElements),
                cells: signal(canvas.cells),
                moveElement: () => undefined,
              },
            },
          ]
        : [],
    });
  }

  function menuActions(): (string | undefined)[] {
    return screen.getAllByRole('menuitem').map((item) => item.textContent?.trim());
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

    it('should be empty while the element has no value', () => {
      expect(screen.getByRole('textbox', { name: 'Text input' })).toHaveValue('');
    });

    it.each(otherTestIds('dropped-text-input'))('should not render %s', (testId) => {
      expect(screen.queryByTestId(testId)).not.toBeInTheDocument();
    });
  });

  describe('text input element with a value', () => {
    beforeEach(async () => mount({ ...textInput, value: typed }));

    it('should show the element value', () => {
      expect(screen.getByRole('textbox', { name: 'Text input' })).toHaveValue(typed);
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

  describe('textfield element with a value', () => {
    beforeEach(async () => mount({ ...textfield, value: typed }));

    it('should show the element value', () => {
      expect(screen.getByRole('textbox', { name: 'Textfield' })).toHaveValue(typed);
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

  describe('datepicker element with a value', () => {
    beforeEach(async () => mount({ ...datepicker, value: pickedDate }));

    it('should show the element value', () => {
      expect(screen.getByLabelText('Datepicker')).toHaveValue(pickedDate);
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

      it('should select the option the element value names', () => {
        expect(screen.getByRole('combobox', { name: 'Dropdown' })).toHaveValue(small.value);
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

    describe('with a later option selected', () => {
      beforeEach(async () => mount({ ...dropdown, value: large.value }));

      it('should select that option', () => {
        expect(screen.getByRole('combobox', { name: 'Dropdown' })).toHaveValue(large.value);
      });
    });

    describe('without options', () => {
      beforeEach(async () => mount({ ...dropdown, options: [], value: '' }));

      it('should render a select with no options', () => {
        expect(screen.getByRole('combobox', { name: 'Dropdown' })).toBeInTheDocument();
        expect(screen.queryAllByRole('option').length).toBe(0);
      });
    });
  });

  describe('actions button', () => {
    it.each([
      { element: div, name: 'Block text actions' },
      { element: span, name: 'Inline text actions' },
      { element: textInput, name: 'Text input actions' },
      { element: textfield, name: 'Textfield actions' },
      { element: datepicker, name: 'Datepicker actions' },
      { element: dropdown, name: 'Dropdown actions' },
    ])('should be named after the $element.type it acts on', async ({ element, name }) => {
      await mount(element);

      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    });

    it('should give its menu the same name', async () => {
      await mount(div);

      fireEvent.click(screen.getByRole('button', { name: divActions }));

      expect(await screen.findByRole('menu', { name: divActions })).toBeInTheDocument();
    });
  });

  describe('actions menu of a datepicker', () => {
    beforeEach(async () => mount(datepicker));

    it('should not offer edit text, as a date input shows no text', async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Datepicker actions' }));

      await screen.findByRole('menu');

      expect(menuActions()).toEqual(['Delete element']);
    });
  });

  describe('actions menu of a dropdown', () => {
    beforeEach(async () => mount(dropdown));

    it('should list edit options then delete element, without edit text', async () => {
      fireEvent.click(screen.getByRole('button', { name: dropdownActions }));

      await screen.findByRole('menu');

      expect(menuActions()).toEqual(['Edit options', 'Delete element']);
    });

    it('should open the edit options dialog, prefilled with the element options, from the edit options action', async () => {
      fireEvent.click(screen.getByRole('button', { name: dropdownActions }));
      fireEvent.click(await screen.findByRole('menuitem', { name: 'Edit options' }));

      const dialog = await screen.findByRole('dialog', { name: 'Edit options' });

      expect(dialog).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: 'Option 1 text' })).toHaveValue(small.text);
      expect(screen.getByRole('textbox', { name: 'Option 1 value' })).toHaveValue(small.value);
      expect(screen.getByRole('textbox', { name: 'Option 2 text' })).toHaveValue(large.text);
      expect(screen.getByRole('textbox', { name: 'Option 2 value' })).toHaveValue(large.value);
    });

    it('should return focus to the actions button when the edit options dialog is cancelled', async () => {
      fireEvent.click(screen.getByRole('button', { name: dropdownActions }));
      fireEvent.click(await screen.findByRole('menuitem', { name: 'Edit options' }));
      await screen.findByRole('dialog', { name: 'Edit options' });

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      await waitFor(() => expect(screen.getByRole('button', { name: dropdownActions })).toHaveFocus());
    });
  });

  describe('actions menu', () => {
    beforeEach(async () => mount(div));

    it('should list edit text then delete element when the actions button is clicked', async () => {
      fireEvent.click(screen.getByRole('button', { name: divActions }));

      await screen.findByRole('menu');

      expect(menuActions()).toEqual(['Edit text', 'Delete element']);
    });

    it('should open the delete confirmation from the delete element action', async () => {
      fireEvent.click(screen.getByRole('button', { name: divActions }));
      fireEvent.click(await screen.findByRole('menuitem', { name: 'Delete element' }));

      const dialog = await screen.findByRole('alertdialog', { name: 'Delete element' });

      expect(dialog).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });

    it('should return focus to the actions button when the deletion is cancelled', async () => {
      fireEvent.click(screen.getByRole('button', { name: divActions }));
      fireEvent.click(await screen.findByRole('menuitem', { name: 'Delete element' }));
      await screen.findByRole('alertdialog', { name: 'Delete element' });

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      await waitFor(() => expect(screen.getByRole('button', { name: divActions })).toHaveFocus());
    });

    it('should open the edit text dialog, prefilled with the element text, from the edit text action', async () => {
      fireEvent.click(screen.getByRole('button', { name: divActions }));
      fireEvent.click(await screen.findByRole('menuitem', { name: 'Edit text' }));

      const dialog = await screen.findByRole('dialog', { name: 'Edit text' });

      expect(dialog).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: 'Text' })).toHaveValue(text);
    });

    it('should return focus to the actions button when the edit text dialog is cancelled', async () => {
      fireEvent.click(screen.getByRole('button', { name: divActions }));
      fireEvent.click(await screen.findByRole('menuitem', { name: 'Edit text' }));
      await screen.findByRole('dialog', { name: 'Edit text' });

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      await waitFor(() => expect(screen.getByRole('button', { name: divActions })).toHaveFocus());
    });
  });

  describe('actions menu of an element that shares its cell', () => {
    const first: CanvasElement = { ...div, uid: 'first' };
    const middle: CanvasElement = { ...div, uid: 'middle' };
    const last: CanvasElement = { ...div, uid: 'last' };
    const neighbours = [first, middle, last];

    async function openMenuOf(element: CanvasElement) {
      await mount(element, { canvasElements: neighbours, cells: [{ ...cell, elements: neighbours }] });
      fireEvent.click(screen.getByRole('button', { name: divActions }));
      await screen.findByRole('menu');
    }

    it('should offer to move the element earlier and later, between editing and deleting', async () => {
      await openMenuOf(middle);

      expect(menuActions()).toEqual(['Edit text', 'Move earlier', 'Move later', 'Delete element']);
    });

    it('should enable both moves for an element in between', async () => {
      await openMenuOf(middle);

      expect(screen.getByRole('menuitem', { name: moveEarlier })).not.toHaveAttribute('aria-disabled');
      expect(screen.getByRole('menuitem', { name: moveLater })).not.toHaveAttribute('aria-disabled');
    });

    it('should disable move earlier for the first element', async () => {
      await openMenuOf(first);

      expect(screen.getByRole('menuitem', { name: moveEarlier })).toHaveAttribute('aria-disabled', 'true');
      expect(screen.getByRole('menuitem', { name: moveLater })).not.toHaveAttribute('aria-disabled');
    });

    it('should disable move later for the last element', async () => {
      await openMenuOf(last);

      expect(screen.getByRole('menuitem', { name: moveLater })).toHaveAttribute('aria-disabled', 'true');
      expect(screen.getByRole('menuitem', { name: moveEarlier })).not.toHaveAttribute('aria-disabled');
    });

    it.each([moveEarlier, moveLater])('should close the menu once %s is picked', async (action) => {
      await openMenuOf(middle);

      fireEvent.click(screen.getByRole('menuitem', { name: action }));

      await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    });
  });

  describe('actions menu of an element in a grid of several cells', () => {
    const cells: GridCell[] = [
      { row: 0, column: 0, elements: [div] },
      { row: 0, column: 1, elements: [] },
      { row: 1, column: 0, elements: [] },
      { row: 1, column: 1, elements: [] },
    ];

    beforeEach(async () => {
      await mount(div, { canvasElements: [div], cells });
      fireEvent.click(screen.getByRole('button', { name: divActions }));
      await screen.findByRole('menu');
    });

    it('should offer to move the element to another cell', () => {
      expect(menuActions()).toEqual(['Edit text', moveToCell, 'Delete element']);
    });

    it('should list every cell but its own in the move to cell menu', async () => {
      fireEvent.click(screen.getByRole('menuitem', { name: moveToCell }));

      const cellMenu = await screen.findByRole('menu', { name: moveToCell });
      const targets = within(cellMenu)
        .getAllByRole('menuitem')
        .map((item) => item.textContent?.trim());

      expect(targets).toEqual(['Row 1, column 2', 'Row 2, column 1', 'Row 2, column 2']);
    });

    it('should close both menus once a cell is picked', async () => {
      fireEvent.click(screen.getByRole('menuitem', { name: moveToCell }));
      const cellMenu = await screen.findByRole('menu', { name: moveToCell });

      fireEvent.click(within(cellMenu).getByRole('menuitem', { name: 'Row 2, column 2' }));

      await waitFor(() => expect(screen.queryAllByRole('menu').length).toBe(0));
    });
  });
});
