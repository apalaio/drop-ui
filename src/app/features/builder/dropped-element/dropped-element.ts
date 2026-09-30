import { Component, computed, input } from '@angular/core';
import { CanvasElement } from '../models/canvas-element';
import { ElementType } from '../models/palette-item';

/** Hover outline per element type, so element kinds are distinguishable on the canvas. */
const HOVER_OUTLINE: Record<ElementType, string> = {
  div: 'border-dashed hover:border-primary/40',
  span: 'border-dotted hover:border-secondary',
};

/** Builder chrome around a single dropped element; renders the real element inside. */
@Component({
  selector: 'dui-dropped-element',
  templateUrl: './dropped-element.html',
  host: {
    class: 'group relative block cursor-grab rounded-box border border-transparent p-1',
    '[class]': 'hoverOutline()',
    '[attr.data-uid]': 'element().uid',
    '[attr.data-element-type]': 'element().type',
  },
})
export class DroppedElement {
  readonly element = input.required<CanvasElement>();

  protected readonly hoverOutline = computed(() => HOVER_OUTLINE[this.element().type]);
}
