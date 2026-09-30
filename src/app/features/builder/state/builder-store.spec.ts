import { TestBed } from '@angular/core/testing';
import { BuilderStore } from './builder-store';

describe('BuilderStore', () => {
  it('provides a div palette item', () => {
    const store = TestBed.inject(BuilderStore);

    expect(store.paletteItems().map((item) => item.type)).toEqual(['div']);
  });

  it('gives every palette item a unique uid', () => {
    const store = TestBed.inject(BuilderStore);
    const uids = store.paletteItems().map((item) => item.uid);

    expect(uids.every((uid) => uid.length > 0)).toBe(true);
    expect(new Set(uids).size).toBe(uids.length);
  });

  it('starts with an empty canvas', () => {
    const store = TestBed.inject(BuilderStore);

    expect(store.canvasElements()).toEqual([]);
  });

  describe('addElement', () => {
    it('creates a canvas element with its own uid, linked to the palette item', () => {
      const store = TestBed.inject(BuilderStore);
      const [div] = store.paletteItems();

      store.addElement(div, 0);

      const [element] = store.canvasElements();
      expect(element.type).toBe('div');
      expect(element.paletteUid).toBe(div.uid);
      expect(element.uid).not.toBe(div.uid);
    });

    it('gives each drop of the same palette item a unique uid', () => {
      const store = TestBed.inject(BuilderStore);
      const [div] = store.paletteItems();

      store.addElement(div, 0);
      store.addElement(div, 1);

      const [first, second] = store.canvasElements();
      expect(first.uid).not.toBe(second.uid);
    });

    it('inserts at the drop index, keeping the order of existing elements', () => {
      const store = TestBed.inject(BuilderStore);
      const [div] = store.paletteItems();

      store.addElement(div, 0);
      store.addElement(div, 1);
      const [first, last] = store.canvasElements().map((element) => element.uid);

      store.addElement(div, 1);
      const [, middle] = store.canvasElements().map((element) => element.uid);

      expect(store.canvasElements().map((element) => element.uid)).toEqual([first, middle, last]);
    });
  });

  describe('moveElement', () => {
    it('reorders canvas elements', () => {
      const store = TestBed.inject(BuilderStore);
      const [div] = store.paletteItems();
      store.addElement(div, 0);
      store.addElement(div, 1);
      store.addElement(div, 2);
      const [a, b, c] = store.canvasElements().map((element) => element.uid);

      store.moveElement(0, 2);

      expect(store.canvasElements().map((element) => element.uid)).toEqual([b, c, a]);
    });
  });
});
