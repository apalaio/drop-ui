import { Dialog, DialogConfig } from '@angular/cdk/dialog';
import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { DropdownOption } from '../models/dropdown-option';
import { GridCell } from '../models/grid-layout';
import {
  CanvasElement,
  DatepickerCanvasElement,
  DropdownCanvasElement,
  TextCanvasElement,
  TextControlCanvasElement,
} from '../models/canvas-element';
import { BuilderStore } from '../state/builder-store';
import { DroppedElement } from './dropped-element';

describe('DroppedElement', () => {
  const cell = { row: 0, column: 0 };
  const div: TextCanvasElement = { uid: 'element-1', type: 'div', paletteUid: 'palette-div', text: 'enter text', ...cell };
  const span: TextCanvasElement = { ...div, uid: 'element-2', type: 'span', paletteUid: 'palette-span' };
  const textInput: TextControlCanvasElement = {
    uid: 'element-4',
    type: 'text-input',
    paletteUid: 'palette-text-input',
    text: 'enter text',
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
  const options: DropdownOption[] = [{ text: 'Small', value: 's' }];
  const dropdown: DropdownCanvasElement = {
    uid: 'element-3',
    type: 'dropdown',
    paletteUid: 'palette-dropdown',
    options,
    value: 's',
    ...cell,
  };

  let store: {
    canvasElements: WritableSignal<CanvasElement[]>;
    cells: WritableSignal<GridCell[]>;
    updateText: ReturnType<typeof vi.fn>;
    updateOptions: ReturnType<typeof vi.fn>;
    updateValue: ReturnType<typeof vi.fn>;
    removeElement: ReturnType<typeof vi.fn>;
    moveElement: ReturnType<typeof vi.fn>;
  };
  let dialogResult: Observable<string | true | DropdownOption[] | undefined>;
  let openDialog: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    store = {
      canvasElements: signal([]),
      cells: signal([]),
      updateText: vi.fn(),
      updateOptions: vi.fn(),
      updateValue: vi.fn(),
      removeElement: vi.fn(),
      moveElement: vi.fn(),
    };
    dialogResult = of(undefined);
    openDialog = vi.fn(() => ({ closed: dialogResult }));
    TestBed.configureTestingModule({
      providers: [
        { provide: BuilderStore, useValue: store },
        { provide: Dialog, useValue: { open: openDialog } },
      ],
    });
  });

  function create(element: CanvasElement) {
    const fixture = TestBed.createComponent(DroppedElement);
    fixture.componentRef.setInput('element', element);
    fixture.detectChanges();
    return fixture;
  }

  function actionsButton(fixture: ComponentFixture<DroppedElement>): HTMLButtonElement {
    return (fixture.nativeElement as HTMLElement).querySelector('button')!;
  }

  function restoreFocusTarget(): unknown {
    return (openDialog.mock.calls[0][1] as DialogConfig).restoreFocus;
  }

  describe('hover outline', () => {
    it('gives a div a dashed primary hover outline', () => {
      const classes = (create(div).nativeElement as HTMLElement).classList;

      expect(classes).toContain('border-dashed');
      expect(classes).toContain('hover:border-primary/40');
    });

    it('gives a span a dotted secondary hover outline', () => {
      const classes = (create(span).nativeElement as HTMLElement).classList;

      expect(classes).toContain('border-dotted');
      expect(classes).toContain('hover:border-secondary');
      expect(classes).not.toContain('hover:border-primary/40');
    });

    it('gives a dropdown a dashed accent hover outline', () => {
      const classes = (create(dropdown).nativeElement as HTMLElement).classList;

      expect(classes).toContain('border-dashed');
      expect(classes).toContain('hover:border-accent');
      expect(classes).not.toContain('hover:border-primary/40');
    });

    it.each([textInput, textfield, datepicker])('gives a $type a dashed info hover outline', (element) => {
      const classes = (create(element).nativeElement as HTMLElement).classList;

      expect(classes).toContain('border-dashed');
      expect(classes).toContain('hover:border-info');
      expect(classes).not.toContain('hover:border-primary/40');
    });

    it('keeps the static wrapper classes alongside the hover outline', () => {
      const classes = (create(div).nativeElement as HTMLElement).classList;

      expect(classes).toContain('cursor-grab');
    });

    it.each([
      { element: div, outline: 'border-primary/40' },
      { element: span, outline: 'border-secondary' },
      { element: textInput, outline: 'border-info' },
      { element: textfield, outline: 'border-info' },
      { element: datepicker, outline: 'border-info' },
      { element: dropdown, outline: 'border-accent' },
    ])('shows a $element.type the same outline while focus is inside it', ({ element, outline }) => {
      const classes = (create(element).nativeElement as HTMLElement).classList;

      expect(classes).toContain(`hover:${outline}`);
      expect(classes).toContain(`focus-within:${outline}`);
    });
  });

  describe('focusActions', () => {
    it('moves focus to the actions button', () => {
      const fixture = create(div);
      document.body.appendChild(fixture.nativeElement);

      fixture.componentInstance.focusActions();

      expect(document.activeElement).toBe(actionsButton(fixture));
      fixture.nativeElement.remove();
    });
  });

  describe('display', () => {
    it('lays a span out inline', () => {
      const classes = (create(span).nativeElement as HTMLElement).classList;

      expect(classes).toContain('inline-block');
      expect(classes).not.toContain('block');
    });

    it.each([div, textInput, textfield, datepicker, dropdown])('lays a $type out as a block', (element) => {
      const classes = (create(element).nativeElement as HTMLElement).classList;

      expect(classes).toContain('block');
      expect(classes).not.toContain('inline-block');
    });
  });

  describe('editText', () => {
    it('stores the text the user saved', () => {
      dialogResult = of('Hello');

      create(div).componentInstance['editText'](div);

      expect(store.updateText).toHaveBeenCalledWith(div.uid, 'Hello');
    });

    it('leaves the text unchanged when the user cancels', () => {
      create(div).componentInstance['editText'](div);

      expect(store.updateText).not.toHaveBeenCalled();
    });

    it('returns focus to the actions button when the dialog closes', () => {
      const fixture = create(div);

      fixture.componentInstance['editText'](div);

      expect(restoreFocusTarget()).toBe(actionsButton(fixture));
    });
  });

  describe('editOptions', () => {
    const saved: DropdownOption[] = [
      { text: 'Medium', value: 'm' },
      { text: 'Large', value: 'l' },
    ];

    it('stores the options the user saved', () => {
      dialogResult = of(saved);

      create(dropdown).componentInstance['editOptions'](dropdown);

      expect(store.updateOptions).toHaveBeenCalledWith(dropdown.uid, saved);
    });

    it('leaves the options unchanged when the user cancels', () => {
      create(dropdown).componentInstance['editOptions'](dropdown);

      expect(store.updateOptions).not.toHaveBeenCalled();
    });

    it('returns focus to the actions button when the dialog closes', () => {
      const fixture = create(dropdown);

      fixture.componentInstance['editOptions'](dropdown);

      expect(restoreFocusTarget()).toBe(actionsButton(fixture));
    });
  });

  describe('updateValue', () => {
    function control(value: string, badInput = false): HTMLInputElement {
      return { value, validity: { badInput } } as HTMLInputElement;
    }

    it('stores the value of the control', () => {
      create(textInput).componentInstance['updateValue'](textInput.uid, control('Ada'));

      expect(store.updateValue).toHaveBeenCalledWith(textInput.uid, 'Ada');
    });

    it('stores an emptied control', () => {
      create(datepicker).componentInstance['updateValue'](datepicker.uid, control(''));

      expect(store.updateValue).toHaveBeenCalledWith(datepicker.uid, '');
    });

    it('leaves the value unchanged while the control holds an incomplete entry', () => {
      create(datepicker).componentInstance['updateValue'](datepicker.uid, control('', true));

      expect(store.updateValue).not.toHaveBeenCalled();
    });
  });

  describe('deleteElement', () => {
    it('removes the element once the user confirms', () => {
      dialogResult = of(true);

      create(div).componentInstance['deleteElement']();

      expect(store.removeElement).toHaveBeenCalledWith(div.uid);
    });

    it('keeps the element when the user cancels', () => {
      create(div).componentInstance['deleteElement']();

      expect(store.removeElement).not.toHaveBeenCalled();
    });

    it('reports the removal once the user confirms', () => {
      dialogResult = of(true);
      const removed = vi.fn();
      const fixture = create(div);
      fixture.componentInstance.removed.subscribe(removed);

      fixture.componentInstance['deleteElement']();

      expect(removed).toHaveBeenCalledTimes(1);
    });

    it('reports no removal when the user cancels', () => {
      const removed = vi.fn();
      const fixture = create(div);
      fixture.componentInstance.removed.subscribe(removed);

      fixture.componentInstance['deleteElement']();

      expect(removed).not.toHaveBeenCalled();
    });

    it('returns focus to the actions button when the dialog closes', () => {
      const fixture = create(div);

      fixture.componentInstance['deleteElement']();

      expect(restoreFocusTarget()).toBe(actionsButton(fixture));
    });
  });

  describe('moving', () => {
    const first: TextCanvasElement = { ...div, uid: 'first' };
    const second: TextCanvasElement = { ...div, uid: 'second' };
    const third: TextCanvasElement = { ...div, uid: 'third' };
    const elsewhere: TextCanvasElement = { ...div, uid: 'elsewhere', row: 0, column: 1 };
    const otherCell: GridCell = { row: 0, column: 1, elements: [elsewhere] };

    beforeEach(() => store.canvasElements.set([first, elsewhere, second, third]));

    it('moves an element one place earlier among the elements of its own cell', () => {
      create(third).componentInstance['moveWithinCell'](-1);

      expect(store.moveElement).toHaveBeenCalledWith(third.uid, cell, 1);
    });

    it('moves an element one place later among the elements of its own cell', () => {
      create(first).componentInstance['moveWithinCell'](1);

      expect(store.moveElement).toHaveBeenCalledWith(first.uid, cell, 1);
    });

    it('moves an element to the end of another cell', () => {
      create(first).componentInstance['moveToCell'](otherCell);

      expect(store.moveElement).toHaveBeenCalledWith(first.uid, otherCell, 1);
    });

    it('reports a move within its cell', () => {
      const moved = vi.fn();
      const fixture = create(first);
      fixture.componentInstance.moved.subscribe(moved);

      fixture.componentInstance['moveWithinCell'](1);

      expect(moved).toHaveBeenCalledTimes(1);
    });

    it('reports a move to another cell', () => {
      const moved = vi.fn();
      const fixture = create(first);
      fixture.componentInstance.moved.subscribe(moved);

      fixture.componentInstance['moveToCell'](otherCell);

      expect(moved).toHaveBeenCalledTimes(1);
    });
  });
});
