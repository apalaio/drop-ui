import { Component } from '@angular/core';
import { BuilderShell } from './features/builder/builder-shell/builder-shell';

@Component({
  imports: [BuilderShell],
  selector: 'dui-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {}
