import { DOCUMENT, effect, inject } from '@angular/core';
import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals';
import themeOrder from 'daisyui/functions/themeOrder';

interface ThemeState {
  theme: string;
  /** Whether the stylesheet holding every theme is wanted; the page starts with its starting theme's alone. */
  allThemesRequested: boolean;
}

export const THEMES: readonly string[] = themeOrder;

/** daisyUI's prebuilt stylesheet of every theme, copied to the app root by the build. */
export const ALL_THEMES_STYLESHEET = 'themes.css';

/**
 * `index.html` names the starting theme on `<html>` and links that theme's CSS, so the name is read
 * from there rather than repeated. Any other start has no CSS on the page and needs the full set.
 */
const createInitialState = (root: HTMLElement): ThemeState => {
  const declared = root.getAttribute('data-theme');
  return declared !== null && THEMES.includes(declared)
    ? { theme: declared, allThemesRequested: false }
    : { theme: THEMES[0], allThemesRequested: true };
};

export const ThemeStore = signalStore(
  { providedIn: 'root' },
  withState(() => createInitialState(inject(DOCUMENT).documentElement)),
  withMethods((store) => ({
    loadAllThemes(): void {
      patchState(store, { allThemesRequested: true });
    },
    setTheme(theme: string): void {
      if (THEMES.includes(theme)) {
        patchState(store, { theme, allThemesRequested: true });
      }
    },
  })),
  withHooks({
    onInit({ theme, allThemesRequested }) {
      const document = inject(DOCUMENT);
      effect(() => document.documentElement.setAttribute('data-theme', theme()));
      effect(() => {
        if (allThemesRequested()) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = ALL_THEMES_STYLESHEET;
          document.head.appendChild(link);
        }
      });
    },
  }),
);
