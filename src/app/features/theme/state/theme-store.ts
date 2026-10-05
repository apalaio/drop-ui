import { DOCUMENT, effect, inject } from '@angular/core';
import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals';
import themeOrder from 'daisyui/functions/themeOrder';

interface ThemeState {
  theme: string;
}

/** Every theme daisyUI ships, in its own order; `themes: all` in `styles.css` builds the same set. */
export const THEMES: readonly string[] = themeOrder;

/** Also set on `<html>` in `index.html`, so the first paint is already themed. */
export const DEFAULT_THEME = 'fantasy';

export const ThemeStore = signalStore(
  { providedIn: 'root' },
  withState<ThemeState>({ theme: DEFAULT_THEME }),
  withMethods((store) => ({
    setTheme(theme: string): void {
      if (THEMES.includes(theme)) {
        patchState(store, { theme });
      }
    },
  })),
  withHooks({
    onInit({ theme }) {
      // On the root element rather than the shell, so CDK overlays under <body> are themed too.
      const root = inject(DOCUMENT).documentElement;
      effect(() => root.setAttribute('data-theme', theme()));
    },
  }),
);
