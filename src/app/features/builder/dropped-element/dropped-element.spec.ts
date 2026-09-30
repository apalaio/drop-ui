import { TestBed } from '@angular/core/testing';
import { CanvasElement } from '../models/canvas-element';
import { DroppedElement } from './dropped-element';

describe('DroppedElement', () => {
  function hostClasses(element: CanvasElement): DOMTokenList {
    const fixture = TestBed.createComponent(DroppedElement);
    fixture.componentRef.setInput('element', element);
    fixture.detectChanges();
    return (fixture.nativeElement as HTMLElement).classList;
  }

  it('gives a div a dashed primary hover outline', () => {
    const classes = hostClasses({ uid: 'element-1', type: 'div', paletteUid: 'palette-div' });

    expect(classes).toContain('border-dashed');
    expect(classes).toContain('hover:border-primary/40');
  });

  it('gives a span a dotted secondary hover outline', () => {
    const classes = hostClasses({ uid: 'element-2', type: 'span', paletteUid: 'palette-span' });

    expect(classes).toContain('border-dotted');
    expect(classes).toContain('hover:border-secondary');
    expect(classes).not.toContain('hover:border-primary/40');
  });

  it('keeps the static wrapper classes alongside the hover outline', () => {
    const classes = hostClasses({ uid: 'element-1', type: 'div', paletteUid: 'palette-div' });

    expect(classes).toContain('cursor-grab');
  });
});
