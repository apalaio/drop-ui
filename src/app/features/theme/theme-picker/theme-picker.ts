import { CdkMenu, CdkMenuItemRadio, CdkMenuTrigger } from '@angular/cdk/menu';
import { NgTemplateOutlet } from '@angular/common';
import { Component, effect, inject, untracked, viewChild, viewChildren } from '@angular/core';
import { THEMES, ThemeStore } from '../state/theme-store';

@Component({
  selector: 'dui-theme-picker',
  imports: [CdkMenuTrigger, CdkMenu, CdkMenuItemRadio, NgTemplateOutlet],
  templateUrl: './theme-picker.html',
})
export class ThemePicker {
  protected readonly store = inject(ThemeStore);
  protected readonly themes = THEMES;

  private readonly menu = viewChild(CdkMenu);
  private readonly options = viewChildren(CdkMenuItemRadio);

  constructor() {
    effect(() => {
      const menu = this.menu();
      const selected = this.options().find((option) => option.checked);
      if (menu && selected) {
        untracked(() => menu.setActiveMenuItem(selected));
      }
    });
  }
}
