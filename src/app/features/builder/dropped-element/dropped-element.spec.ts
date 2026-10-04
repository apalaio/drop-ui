import { Dialog } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { CanvasElement } from '../models/canvas-element';
import { BuilderStore } from '../state/builder-store';
import { DroppedElement } from './dropped-element';

describe('DroppedElement', () => {
  const cell = { row: 0, column: 0 };
  const div: CanvasElement = { uid: 'element-1', type: 'div', paletteUid: 'palette-div', text: 'enter text', ...cell };
  const span: CanvasElement = { ...div, uid: 'element-2', type: 'span', paletteUid: 'palette-span' };

  let store: { updateText: ReturnType<typeof vi.fn>; removeElement: ReturnType<typeof vi.fn> };
  let dialogResult: Observable<string | true | undefined>;

  beforeEach(() => {
    store = { updateText: vi.fn(), removeElement: vi.fn() };
    dialogResult = of(undefined);
    TestBed.configureTestingModule({
      providers: [
        { provide: BuilderStore, useValue: store },
        { provide: Dialog, useValue: { open: () => ({ closed: dialogResult }) } },
      ],
    });
  });

  function create(element: CanvasElement) {
    const fixture = TestBed.createComponent(DroppedElement);
    fixture.componentRef.setInput('element', element);
    fixture.detectChanges();
    return fixture;
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

    it('keeps the static wrapper classes alongside the hover outline', () => {
      const classes = (create(div).nativeElement as HTMLElement).classList;

      expect(classes).toContain('cursor-grab');
    });
  });

  describe('editText', () => {
    it('stores the text the user saved', () => {
      dialogResult = of('Hello');

      create(div).componentInstance['editText']();

      expect(store.updateText).toHaveBeenCalledWith(div.uid, 'Hello');
    });

    it('leaves the text unchanged when the user cancels', () => {
      create(div).componentInstance['editText']();

      expect(store.updateText).not.toHaveBeenCalled();
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
  });
});
