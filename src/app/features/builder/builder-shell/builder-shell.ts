import { CdkDropListGroup } from '@angular/cdk/drag-drop';
import { Component } from '@angular/core';
import { Canvas } from '../canvas/canvas';
import { ElementPalette } from '../element-palette/element-palette';

@Component({
  selector: 'dui-builder-shell',
  imports: [ElementPalette, Canvas],
  hostDirectives: [CdkDropListGroup],
  templateUrl: './builder-shell.html',
  styleUrl: './builder-shell.css',
})
export class BuilderShell {}
