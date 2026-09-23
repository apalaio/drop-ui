import { Component } from '@angular/core';
import { Canvas } from '../canvas/canvas';
import { ElementPalette } from '../element-palette/element-palette';

@Component({
  selector: 'app-builder-shell',
  imports: [ElementPalette, Canvas],
  templateUrl: './builder-shell.html',
  styleUrl: './builder-shell.css',
})
export class BuilderShell {}
