import { LiveAnnouncer } from '@angular/cdk/a11y';
import { TestBed } from '@angular/core/testing';
import { MAX_GRID_SIZE, MIN_GRID_SIZE } from '../models/grid-layout';
import { ElementType } from '../models/palette-item';
import { BuilderStore, DEFAULT_ELEMENT_TEXT } from './builder-store';

type Store = InstanceType<typeof BuilderStore>;

describe('BuilderStore', () => {
  const origin = { row: 0, column: 0 };
  const controlTypes = ['text-input', 'textfield', 'datepicker', 'dropdown'] as const;

  function uidsIn(store: Store, row: number, column: number): string[] {
    const cell = store.cells().find((candidate) => candidate.row === row && candidate.column === column);
    return (cell?.elements ?? []).map((element) => element.uid);
  }

  function addTo(store: Store, row: number, column: number): string {
    const index = uidsIn(store, row, column).length;
    store.addElement(store.paletteItems()[0], { row, column }, index);
    return uidsIn(store, row, column)[index];
  }

  function addOfType(store: Store, type: ElementType): string {
    const item = store.paletteItems().find((candidate) => candidate.type === type)!;
    const index = uidsIn(store, 0, 0).length;
    store.addElement(item, origin, index);
    return uidsIn(store, 0, 0)[index];
  }

  it('provides a palette item per element type', () => {
    const store = TestBed.inject(BuilderStore);

    expect(store.paletteItems().map((item) => item.type)).toEqual([
      'div',
      'span',
      'text-input',
      'textfield',
      'datepicker',
      'dropdown',
    ]);
  });

  it('gives every palette item a unique uid', () => {
    const store = TestBed.inject(BuilderStore);
    const uids = store.paletteItems().map((item) => item.uid);

    expect(uids.every((uid) => uid.length > 0)).toBe(true);
    expect(new Set(uids).size).toBe(uids.length);
  });

  it('starts with an empty canvas', () => {
    const store = TestBed.inject(BuilderStore);

    expect(store.canvasElements()).toEqual([]);
  });

  it('starts with a one by one grid', () => {
    const store = TestBed.inject(BuilderStore);

    expect(store.grid()).toEqual({ rows: 1, columns: 1 });
  });

  describe('cells', () => {
    it('exposes a single empty cell for the initial grid', () => {
      const store = TestBed.inject(BuilderStore);

      expect(store.cells()).toEqual([{ row: 0, column: 0, elements: [] }]);
    });

    it('lists one cell per grid position, row by row', () => {
      const store = TestBed.inject(BuilderStore);

      store.setGridSize('rows', 2);
      store.setGridSize('columns', 3);

      expect(store.cells().map((cell) => [cell.row, cell.column])).toEqual([
        [0, 0],
        [0, 1],
        [0, 2],
        [1, 0],
        [1, 1],
        [1, 2],
      ]);
    });

    it('groups the elements under the cell they sit in, in order', () => {
      const store = TestBed.inject(BuilderStore);
      store.setGridSize('rows', 2);
      store.setGridSize('columns', 2);

      const first = addTo(store, 1, 0);
      const other = addTo(store, 0, 1);
      const second = addTo(store, 1, 0);

      expect(store.cells().map((cell) => cell.elements.map((element) => element.uid))).toEqual([
        [],
        [other],
        [first, second],
        [],
      ]);
    });
  });

  describe.each([
    { axis: 'rows', other: 'columns' },
    { axis: 'columns', other: 'rows' },
  ] as const)('setGridSize along $axis', ({ axis, other }) => {
    function cell(along: number, across: number): [row: number, column: number] {
      return axis === 'rows' ? [along, across] : [across, along];
    }

    it(`sets the number of ${axis}, leaving the ${other} alone`, () => {
      const store = TestBed.inject(BuilderStore);

      store.setGridSize(axis, 3);

      expect(store.grid()).toEqual({ [axis]: 3, [other]: 1 });
    });

    it('clamps a value below the minimum', () => {
      const store = TestBed.inject(BuilderStore);
      store.setGridSize(axis, 3);

      store.setGridSize(axis, 0);

      expect(store.grid()[axis]).toBe(MIN_GRID_SIZE);
    });

    it('clamps a negative value to the minimum', () => {
      const store = TestBed.inject(BuilderStore);
      store.setGridSize(axis, 3);

      store.setGridSize(axis, -4);

      expect(store.grid()[axis]).toBe(MIN_GRID_SIZE);
    });

    it('clamps a value above the maximum', () => {
      const store = TestBed.inject(BuilderStore);

      store.setGridSize(axis, 99);

      expect(store.grid()[axis]).toBe(MAX_GRID_SIZE);
    });

    it('truncates a fractional value', () => {
      const store = TestBed.inject(BuilderStore);

      store.setGridSize(axis, 2.9);

      expect(store.grid()[axis]).toBe(2);
    });

    it.each([NaN, Infinity, -Infinity])('ignores %s', (size) => {
      const store = TestBed.inject(BuilderStore);
      store.setGridSize(axis, 3);

      store.setGridSize(axis, size);

      expect(store.grid()).toEqual({ [axis]: 3, [other]: 1 });
    });

    it('keeps existing elements in their cell when growing', () => {
      const store = TestBed.inject(BuilderStore);
      const a = addTo(store, 0, 0);
      const b = addTo(store, 0, 0);

      store.setGridSize(axis, 3);

      expect(store.cells().map((gridCell) => gridCell.elements.map((element) => element.uid))).toEqual([[a, b], [], []]);
    });

    it(`moves elements of removed ${axis} into the last remaining one, keeping their place along the ${other}`, () => {
      const store = TestBed.inject(BuilderStore);
      store.setGridSize(axis, 3);
      store.setGridSize(other, 2);
      const kept = addTo(store, ...cell(0, 1));
      const moved = addTo(store, ...cell(2, 1));

      store.setGridSize(axis, 2);

      expect(store.cells().length).toBe(4);
      expect(uidsIn(store, ...cell(0, 1))).toEqual([kept]);
      expect(uidsIn(store, 1, 1)).toEqual([moved]);
      expect(store.canvasElements().find((element) => element.uid === moved)).toMatchObject({ row: 1, column: 1 });
    });

    it('never deletes an element when shrinking', () => {
      const store = TestBed.inject(BuilderStore);
      store.setGridSize(axis, 3);
      const uids = [addTo(store, ...cell(0, 0)), addTo(store, ...cell(1, 0)), addTo(store, ...cell(2, 0))];

      store.setGridSize(axis, 1);

      expect(store.canvasElements().length).toBe(3);
      expect([...uidsIn(store, 0, 0)].sort()).toEqual([...uids].sort());
    });

    it('keeps the relative order of elements that shared a removed cell', () => {
      const store = TestBed.inject(BuilderStore);
      store.setGridSize(axis, 2);
      addTo(store, 0, 0);
      const a = addTo(store, ...cell(1, 0));
      const b = addTo(store, ...cell(1, 0));
      const c = addTo(store, ...cell(1, 0));

      store.setGridSize(axis, 1);

      const relocated = uidsIn(store, 0, 0).filter((uid) => [a, b, c].includes(uid));
      expect(relocated).toEqual([a, b, c]);
    });
  });

  describe('addElement', () => {
    it('creates a canvas element with its own uid, linked to the palette item', () => {
      const store = TestBed.inject(BuilderStore);
      const [div] = store.paletteItems();

      store.addElement(div, origin, 0);

      const [element] = store.canvasElements();
      expect(element.type).toBe('div');
      expect(element.paletteUid).toBe(div.uid);
      expect(element.uid).not.toBe(div.uid);
    });

    it('gives each drop of the same palette item a unique uid', () => {
      const store = TestBed.inject(BuilderStore);
      const [div] = store.paletteItems();

      store.addElement(div, origin, 0);
      store.addElement(div, origin, 1);

      const [first, second] = store.canvasElements();
      expect(first.uid).not.toBe(second.uid);
    });

    it('inserts at the drop index, keeping the order of existing elements', () => {
      const store = TestBed.inject(BuilderStore);
      const [div] = store.paletteItems();

      store.addElement(div, origin, 0);
      store.addElement(div, origin, 1);
      const [first, last] = uidsIn(store, 0, 0);

      store.addElement(div, origin, 1);
      const [, middle] = uidsIn(store, 0, 0);

      expect(uidsIn(store, 0, 0)).toEqual([first, middle, last]);
    });

    it.each(['div', 'span', 'text-input', 'textfield'] as const)('starts a %s with the default text', (type) => {
      const store = TestBed.inject(BuilderStore);

      addOfType(store, type);

      expect(store.canvasElements()).toEqual([expect.objectContaining({ type, text: DEFAULT_ELEMENT_TEXT })]);
      expect(store.canvasElements()[0]).not.toHaveProperty('options');
    });

    it.each(['div', 'span'] as const)('starts a %s without a value', (type) => {
      const store = TestBed.inject(BuilderStore);

      addOfType(store, type);

      expect(store.canvasElements()[0]).not.toHaveProperty('value');
    });

    it.each(controlTypes)('starts a %s with an empty value', (type) => {
      const store = TestBed.inject(BuilderStore);

      addOfType(store, type);

      expect(store.canvasElements()[0]).toMatchObject({ type, value: '' });
    });

    it('starts a datepicker with neither text nor options', () => {
      const store = TestBed.inject(BuilderStore);

      addOfType(store, 'datepicker');

      expect(store.canvasElements()[0]).toMatchObject({ type: 'datepicker' });
      expect(store.canvasElements()[0]).not.toHaveProperty('text');
      expect(store.canvasElements()[0]).not.toHaveProperty('options');
    });

    it('starts a dropdown with an empty list of options and no text', () => {
      const store = TestBed.inject(BuilderStore);

      addOfType(store, 'dropdown');

      expect(store.canvasElements()[0]).toMatchObject({ type: 'dropdown', options: [] });
      expect(store.canvasElements()[0]).not.toHaveProperty('text');
    });

    it('places the element in the cell it was dropped in', () => {
      const store = TestBed.inject(BuilderStore);
      store.setGridSize('rows', 2);
      store.setGridSize('columns', 2);

      store.addElement(store.paletteItems()[0], { row: 1, column: 0 }, 0);

      const [element] = store.canvasElements();
      expect(element).toMatchObject({ row: 1, column: 0 });
      expect(store.cells().map((cell) => cell.elements.length)).toEqual([0, 0, 1, 0]);
    });

    it('counts the drop index among the elements of the target cell only', () => {
      const store = TestBed.inject(BuilderStore);
      const [div] = store.paletteItems();
      store.setGridSize('columns', 2);
      const [left1, left2] = [addTo(store, 0, 0), addTo(store, 0, 0)];
      const [right1, right2] = [addTo(store, 0, 1), addTo(store, 0, 1)];

      store.addElement(div, { row: 0, column: 1 }, 1);
      const [, inserted] = uidsIn(store, 0, 1);

      expect(uidsIn(store, 0, 0)).toEqual([left1, left2]);
      expect(uidsIn(store, 0, 1)).toEqual([right1, inserted, right2]);
    });
  });

  describe('updateText', () => {
    it('changes the text of the matching element only', () => {
      const store = TestBed.inject(BuilderStore);
      const [div] = store.paletteItems();
      store.addElement(div, origin, 0);
      store.addElement(div, origin, 1);
      const [first, second] = store.cells()[0].elements;

      store.updateText(second.uid, 'Hello');

      expect(store.cells()[0].elements).toEqual([first, { ...second, text: 'Hello' }]);
    });

    it.each(['datepicker', 'dropdown'] as const)('leaves a %s, which has no text, as it was', (type) => {
      const store = TestBed.inject(BuilderStore);
      const uid = addOfType(store, type);
      const before = store.canvasElements();

      store.updateText(uid, 'Hello');

      expect(store.canvasElements()).toEqual(before);
    });
  });

  describe('updateOptions', () => {
    const options = [
      { text: 'Small', value: 's' },
      { text: 'Large', value: 'l' },
    ];

    it('changes the options of the matching element only', () => {
      const store = TestBed.inject(BuilderStore);
      const [first, second] = [addOfType(store, 'dropdown'), addOfType(store, 'dropdown')];

      store.updateOptions(second, options);

      expect(store.canvasElements()).toEqual([
        expect.objectContaining({ uid: first, options: [] }),
        expect.objectContaining({ uid: second, options }),
      ]);
    });

    it('replaces the options saved earlier', () => {
      const store = TestBed.inject(BuilderStore);
      const uid = addOfType(store, 'dropdown');
      store.updateOptions(uid, options);

      store.updateOptions(uid, [options[1]]);

      expect(store.canvasElements()[0]).toMatchObject({ options: [options[1]] });
    });

    it.each(['div', 'datepicker'] as const)('leaves a %s, which is not a dropdown, as it was', (type) => {
      const store = TestBed.inject(BuilderStore);
      const uid = addOfType(store, type);
      const before = store.canvasElements();

      store.updateOptions(uid, options);

      expect(store.canvasElements()).toEqual(before);
    });

    it('keeps the options of a dropdown moved to another cell', () => {
      const store = TestBed.inject(BuilderStore);
      store.setGridSize('columns', 2);
      const uid = addOfType(store, 'dropdown');
      store.updateOptions(uid, options);

      store.moveElement(uid, { row: 0, column: 1 }, 0);

      expect(store.canvasElements()).toEqual([expect.objectContaining({ uid, options, row: 0, column: 1 })]);
    });

    it('selects the first option when options are first saved', () => {
      const store = TestBed.inject(BuilderStore);
      const uid = addOfType(store, 'dropdown');

      store.updateOptions(uid, options);

      expect(store.canvasElements()[0]).toMatchObject({ value: 's' });
    });

    it('keeps the selected option when it is still among the saved options', () => {
      const store = TestBed.inject(BuilderStore);
      const uid = addOfType(store, 'dropdown');
      store.updateOptions(uid, options);
      store.updateValue(uid, 'l');

      store.updateOptions(uid, [{ text: 'Medium', value: 'm' }, options[1]]);

      expect(store.canvasElements()[0]).toMatchObject({ value: 'l' });
    });

    it('selects the first option when the selected one is no longer among the saved options', () => {
      const store = TestBed.inject(BuilderStore);
      const uid = addOfType(store, 'dropdown');
      store.updateOptions(uid, options);
      store.updateValue(uid, 'l');

      store.updateOptions(uid, [{ text: 'Medium', value: 'm' }, options[0]]);

      expect(store.canvasElements()[0]).toMatchObject({ value: 'm' });
    });

    it('clears the selection when no option is left', () => {
      const store = TestBed.inject(BuilderStore);
      const uid = addOfType(store, 'dropdown');
      store.updateOptions(uid, options);

      store.updateOptions(uid, []);

      expect(store.canvasElements()[0]).toMatchObject({ value: '' });
    });
  });

  describe('updateValue', () => {
    const options = [
      { text: 'Small', value: 's' },
      { text: 'Large', value: 'l' },
    ];

    it.each([
      { type: 'text-input', value: 'Ada' },
      { type: 'textfield', value: 'Two\nlines' },
      { type: 'datepicker', value: '2026-10-05' },
    ] as const)('changes the value of the matching $type only', ({ type, value }) => {
      const store = TestBed.inject(BuilderStore);
      const [first, second] = [addOfType(store, type), addOfType(store, type)];

      store.updateValue(second, value);

      expect(store.canvasElements()).toEqual([
        expect.objectContaining({ uid: first, value: '' }),
        expect.objectContaining({ uid: second, value }),
      ]);
    });

    it('selects an option of the matching dropdown only', () => {
      const store = TestBed.inject(BuilderStore);
      const [first, second] = [addOfType(store, 'dropdown'), addOfType(store, 'dropdown')];
      store.updateOptions(first, options);
      store.updateOptions(second, options);

      store.updateValue(second, 'l');

      expect(store.canvasElements()).toEqual([
        expect.objectContaining({ uid: first, value: 's' }),
        expect.objectContaining({ uid: second, value: 'l' }),
      ]);
    });

    it('leaves a dropdown as it was for a value none of its options has', () => {
      const store = TestBed.inject(BuilderStore);
      const uid = addOfType(store, 'dropdown');
      store.updateOptions(uid, options);
      const before = store.canvasElements();

      store.updateValue(uid, 'xl');

      expect(store.canvasElements()).toEqual(before);
    });

    it.each(['div', 'span'] as const)('leaves a %s, which has no value, as it was', (type) => {
      const store = TestBed.inject(BuilderStore);
      const uid = addOfType(store, type);
      const before = store.canvasElements();

      store.updateValue(uid, 'Ada');

      expect(store.canvasElements()).toEqual(before);
    });

    it('keeps the value of a control moved to another cell', () => {
      const store = TestBed.inject(BuilderStore);
      store.setGridSize('columns', 2);
      const uid = addOfType(store, 'text-input');
      store.updateValue(uid, 'Ada');

      store.moveElement(uid, { row: 0, column: 1 }, 0);

      expect(store.canvasElements()).toEqual([expect.objectContaining({ uid, value: 'Ada', row: 0, column: 1 })]);
    });

    it('keeps the value of a control whose cell is removed when the grid shrinks', () => {
      const store = TestBed.inject(BuilderStore);
      store.setGridSize('columns', 2);
      const uid = addOfType(store, 'datepicker');
      store.moveElement(uid, { row: 0, column: 1 }, 0);
      store.updateValue(uid, '2026-10-05');

      store.setGridSize('columns', 1);

      expect(store.canvasElements()).toEqual([
        expect.objectContaining({ uid, value: '2026-10-05', row: 0, column: 0 }),
      ]);
    });
  });

  describe('removeElement', () => {
    it('removes the matching element only, keeping the order of the rest', () => {
      const store = TestBed.inject(BuilderStore);
      const [a, b, c] = [addTo(store, 0, 0), addTo(store, 0, 0), addTo(store, 0, 0)];

      store.removeElement(b);

      expect(uidsIn(store, 0, 0)).toEqual([a, c]);
    });
  });

  describe('moveElement', () => {
    it('moves an element down within its cell', () => {
      const store = TestBed.inject(BuilderStore);
      const [a, b, c] = [addTo(store, 0, 0), addTo(store, 0, 0), addTo(store, 0, 0)];

      store.moveElement(a, origin, 2);

      expect(uidsIn(store, 0, 0)).toEqual([b, c, a]);
    });

    it('moves an element up within its cell', () => {
      const store = TestBed.inject(BuilderStore);
      const [a, b, c] = [addTo(store, 0, 0), addTo(store, 0, 0), addTo(store, 0, 0)];

      store.moveElement(c, origin, 1);

      expect(uidsIn(store, 0, 0)).toEqual([a, c, b]);
    });

    it('leaves the other cells untouched when reordering within a cell', () => {
      const store = TestBed.inject(BuilderStore);
      store.setGridSize('columns', 2);
      const [left1, left2] = [addTo(store, 0, 0), addTo(store, 0, 0)];
      const [right1, right2] = [addTo(store, 0, 1), addTo(store, 0, 1)];

      store.moveElement(right1, { row: 0, column: 1 }, 1);

      expect(uidsIn(store, 0, 0)).toEqual([left1, left2]);
      expect(uidsIn(store, 0, 1)).toEqual([right2, right1]);
    });

    it('moves an element into another cell at the drop index', () => {
      const store = TestBed.inject(BuilderStore);
      store.setGridSize('columns', 2);
      const [left1, left2] = [addTo(store, 0, 0), addTo(store, 0, 0)];
      const [right1, right2] = [addTo(store, 0, 1), addTo(store, 0, 1)];

      store.moveElement(left1, { row: 0, column: 1 }, 1);

      expect(uidsIn(store, 0, 0)).toEqual([left2]);
      expect(uidsIn(store, 0, 1)).toEqual([right1, left1, right2]);
    });

    it('moves an element into an empty cell', () => {
      const store = TestBed.inject(BuilderStore);
      store.setGridSize('rows', 2);
      store.setGridSize('columns', 2);
      const [a, b] = [addTo(store, 0, 0), addTo(store, 0, 0)];

      store.moveElement(b, { row: 1, column: 1 }, 0);

      expect(uidsIn(store, 0, 0)).toEqual([a]);
      expect(uidsIn(store, 1, 1)).toEqual([b]);
      expect(store.canvasElements().find((element) => element.uid === b)).toMatchObject({ row: 1, column: 1 });
    });

    it('keeps the uid and text of an element moved to another cell', () => {
      const store = TestBed.inject(BuilderStore);
      store.setGridSize('columns', 2);
      const uid = addTo(store, 0, 0);
      store.updateText(uid, 'Hello');

      store.moveElement(uid, { row: 0, column: 1 }, 0);

      expect(store.canvasElements()).toEqual([expect.objectContaining({ uid, text: 'Hello', row: 0, column: 1 })]);
    });

    it('does nothing for an unknown uid', () => {
      const store = TestBed.inject(BuilderStore);
      store.setGridSize('columns', 2);
      const [a, b] = [addTo(store, 0, 0), addTo(store, 0, 0)];
      const c = addTo(store, 0, 1);

      store.moveElement('no-such-element', { row: 0, column: 1 }, 0);

      expect(store.canvasElements().length).toBe(3);
      expect(uidsIn(store, 0, 0)).toEqual([a, b]);
      expect(uidsIn(store, 0, 1)).toEqual([c]);
    });
  });

  describe('announcements', () => {
    let announce: ReturnType<typeof vi.spyOn>;
    let store: Store;

    beforeEach(() => {
      announce = vi.spyOn(TestBed.inject(LiveAnnouncer), 'announce');
      store = TestBed.inject(BuilderStore);
    });

    it('announces an added element by its palette label and cell', () => {
      store.setGridSize('columns', 2);

      store.addElement(store.paletteItems()[0], { row: 0, column: 1 }, 0);

      expect(announce).toHaveBeenLastCalledWith('Block text added to Row 1, column 2.');
    });

    it('announces the cell an element was moved to', () => {
      store.setGridSize('rows', 2);
      const uid = addOfType(store, 'dropdown');

      store.moveElement(uid, { row: 1, column: 0 }, 0);

      expect(announce).toHaveBeenLastCalledWith('Dropdown moved to Row 2, column 1.');
    });

    it('announces the new position of an element reordered within its cell', () => {
      const [first] = [addTo(store, 0, 0), addTo(store, 0, 0), addTo(store, 0, 0)];

      store.moveElement(first, origin, 1);

      expect(announce).toHaveBeenLastCalledWith('Block text moved to position 2 of 3.');
    });

    it('stays silent when an element is dropped back where it was', () => {
      const [first] = [addTo(store, 0, 0), addTo(store, 0, 0)];
      announce.mockClear();

      store.moveElement(first, origin, 0);

      expect(announce).not.toHaveBeenCalled();
    });

    it('stays silent when asked to move an unknown element', () => {
      store.moveElement('no-such-element', origin, 0);

      expect(announce).not.toHaveBeenCalled();
    });

    it('announces a deleted element by its label', () => {
      const uid = addOfType(store, 'text-input');

      store.removeElement(uid);

      expect(announce).toHaveBeenLastCalledWith('Text input deleted.');
    });

    it('stays silent when asked to delete an unknown element', () => {
      store.removeElement('no-such-element');

      expect(announce).not.toHaveBeenCalled();
    });

    it('announces the grid size that took effect, which may not be the one asked for', () => {
      store.setGridSize('rows', 99);

      expect(announce).toHaveBeenLastCalledWith(`Grid set to ${MAX_GRID_SIZE} rows and 1 column.`);
    });

    it('stays silent when the grid size is not a number', () => {
      store.setGridSize('rows', NaN);

      expect(announce).not.toHaveBeenCalled();
    });
  });
});
