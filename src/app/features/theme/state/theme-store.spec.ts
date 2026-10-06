import { LiveAnnouncer } from '@angular/cdk/a11y';
import { TestBed } from '@angular/core/testing';
import themeOrder from 'daisyui/functions/themeOrder';
import { ALL_THEMES_STYLESHEET, THEMES, ThemeStore } from './theme-store';

describe('ThemeStore', () => {
  const startingTheme = 'fantasy';
  const otherTheme = 'dracula';
  const unknownTheme = 'not-a-daisyui-theme';
  const root = document.documentElement;

  function appliedTheme(): string | null {
    TestBed.flushEffects();
    return root.getAttribute('data-theme');
  }

  function allThemesStylesheets(): HTMLLinkElement[] {
    TestBed.flushEffects();
    return Array.from(document.head.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')).filter(
      (link) => link.getAttribute('href') === ALL_THEMES_STYLESHEET,
    );
  }

  beforeEach(() => root.setAttribute('data-theme', startingTheme));

  afterEach(() => {
    root.removeAttribute('data-theme');
    document.head.querySelectorAll('link[rel="stylesheet"]').forEach((link) => link.remove());
  });

  it('offers every theme daisyUI ships', () => {
    expect(THEMES).toEqual(themeOrder);
  });

  describe('starting theme', () => {
    it('is the theme the document declares', () => {
      const store = TestBed.inject(ThemeStore);

      expect(store.theme()).toBe(startingTheme);
    });

    it('stays applied to the root element', () => {
      TestBed.inject(ThemeStore);

      expect(appliedTheme()).toBe(startingTheme);
    });

    it('does not load the other themes', () => {
      TestBed.inject(ThemeStore);

      expect(allThemesStylesheets()).toEqual([]);
    });

    it('is the first theme when the document declares none', () => {
      root.removeAttribute('data-theme');

      const store = TestBed.inject(ThemeStore);

      expect(store.theme()).toBe(THEMES[0]);
      expect(appliedTheme()).toBe(THEMES[0]);
    });

    it('is the first theme when the document declares one daisyUI does not ship', () => {
      root.setAttribute('data-theme', unknownTheme);

      const store = TestBed.inject(ThemeStore);

      expect(store.theme()).toBe(THEMES[0]);
      expect(appliedTheme()).toBe(THEMES[0]);
    });

    it('loads every theme when it could not come from the document', () => {
      root.removeAttribute('data-theme');

      TestBed.inject(ThemeStore);

      expect(allThemesStylesheets().length).toBe(1);
    });
  });

  describe('loadAllThemes', () => {
    it('adds the stylesheet holding every theme', () => {
      const store = TestBed.inject(ThemeStore);

      store.loadAllThemes();

      expect(allThemesStylesheets().length).toBe(1);
    });

    it('leaves the theme as it was', () => {
      const store = TestBed.inject(ThemeStore);

      store.loadAllThemes();

      expect(store.theme()).toBe(startingTheme);
    });

    it('adds the stylesheet only once', () => {
      const store = TestBed.inject(ThemeStore);
      store.loadAllThemes();
      allThemesStylesheets();

      store.loadAllThemes();
      store.setTheme(otherTheme);

      expect(allThemesStylesheets().length).toBe(1);
    });
  });

  describe('setTheme', () => {
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

    it('loads every theme, as only the starting one is on the page', () => {
      const store = TestBed.inject(ThemeStore);

      store.setTheme(otherTheme);

      expect(allThemesStylesheets().length).toBe(1);
    });

    it('ignores a theme daisyUI does not ship', () => {
      const store = TestBed.inject(ThemeStore);

      store.setTheme(unknownTheme);

      expect(store.theme()).toBe(startingTheme);
      expect(appliedTheme()).toBe(startingTheme);
      expect(allThemesStylesheets()).toEqual([]);
    });

    it('announces the selected theme', () => {
      const announce = vi.spyOn(TestBed.inject(LiveAnnouncer), 'announce');
      const store = TestBed.inject(ThemeStore);

      store.setTheme(otherTheme);

      expect(announce).toHaveBeenCalledWith(`Theme changed to ${otherTheme}.`);
    });

    it('announces nothing for a theme daisyUI does not ship', () => {
      const announce = vi.spyOn(TestBed.inject(LiveAnnouncer), 'announce');
      const store = TestBed.inject(ThemeStore);

      store.setTheme(unknownTheme);

      expect(announce).not.toHaveBeenCalled();
    });
  });
});
