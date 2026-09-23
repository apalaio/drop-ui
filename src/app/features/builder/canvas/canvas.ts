import { CdkDropList } from '@angular/cdk/drag-drop';
import { Component } from '@angular/core';

@Component({
  selector: 'dui-canvas',
  imports: [CdkDropList],
  templateUrl: './canvas.html',
  host: { class: 'block h-full' },
})
export class Canvas {}
