import { Component, input } from '@angular/core';
import { CanvasElement } from '../models/canvas-element';

/** Builder chrome around a single dropped element; renders the real element inside. */
@Component({
  selector: 'dui-dropped-element',
  templateUrl: './dropped-element.html',
  host: {
    class:
      'group relative block cursor-grab rounded-box border border-dashed border-transparent p-1 hover:border-primary/40',
    '[attr.data-uid]': 'element().uid',
    '[attr.data-element-type]': 'element().type',
  },
})
export class DroppedElement {
  readonly element = input.required<CanvasElement>();
}
