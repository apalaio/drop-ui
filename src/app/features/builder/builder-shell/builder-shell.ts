import { CdkDropListGroup } from '@angular/cdk/drag-drop';
import { Component } from '@angular/core';
import { ThemePicker } from '../../theme/theme-picker/theme-picker';
import { Canvas } from '../canvas/canvas';
import { ElementPalette } from '../element-palette/element-palette';
import { LayoutPanel } from '../layout-panel/layout-panel';

@Component({
  selector: 'dui-builder-shell',
  imports: [ThemePicker, LayoutPanel, ElementPalette, Canvas],
  hostDirectives: [CdkDropListGroup],
  templateUrl: './builder-shell.html',
  styleUrl: './builder-shell.css',
})
export class BuilderShell {}
