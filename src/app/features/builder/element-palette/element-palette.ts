import { CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { Component, inject } from '@angular/core';
import { BuilderStore } from '../state/builder-store';

@Component({
  selector: 'dui-element-palette',
  imports: [CdkDropList, CdkDrag],
  templateUrl: './element-palette.html',
  host: { class: 'block p-4' },
})
export class ElementPalette {
  protected readonly store = inject(BuilderStore);

  /** The palette is a source only: its own items may return, nothing else may enter. */
  protected readonly acceptNothing = () => false;
}
