import { TestBed } from '@angular/core/testing';
import themeOrder from 'daisyui/functions/themeOrder';
import { DEFAULT_THEME, THEMES, ThemeStore } from './theme-store';

describe('ThemeStore', () => {
  const otherTheme = 'dracula';
  const unknownTheme = 'not-a-daisyui-theme';

  function appliedTheme(): string | null {
    TestBed.flushEffects();
    return document.documentElement.getAttribute('data-theme');
  }

  afterEach(() => document.documentElement.removeAttribute('data-theme'));

  it('offers every theme daisyUI ships', () => {
    expect(THEMES).toEqual(themeOrder);
  });

  it('offers the default theme', () => {
    expect(THEMES).toContain(DEFAULT_THEME);
  });

  it('starts in the fantasy theme', () => {
    const store = TestBed.inject(ThemeStore);

    expect(store.theme()).toBe('fantasy');
  });

  it('applies the starting theme to the root element', () => {
    TestBed.inject(ThemeStore);

    expect(appliedTheme()).toBe(DEFAULT_THEME);
  });

  it('switches to a selected theme', () => {
    const store = TestBed.inject(ThemeStore);

    store.setTheme(otherTheme);

    expect(store.theme()).toBe(otherTheme);
  });

  it('applies a selected theme to the root element', () => {
    const store = TestBed.inject(ThemeStore);

    store.setTheme(otherTheme);

    expect(appliedTheme()).toBe(otherTheme);
  });

  it('ignores a theme daisyUI does not ship', () => {
    const store = TestBed.inject(ThemeStore);

    store.setTheme(unknownTheme);

    expect(store.theme()).toBe(DEFAULT_THEME);
    expect(appliedTheme()).toBe(DEFAULT_THEME);
  });
});
