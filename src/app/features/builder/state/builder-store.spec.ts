import { TestBed } from '@angular/core/testing';
import { BuilderStore, DEFAULT_ELEMENT_TEXT } from './builder-store';

describe('BuilderStore', () => {
  it('provides div and span palette items', () => {
    const store = TestBed.inject(BuilderStore);

    expect(store.paletteItems().map((item) => item.type)).toEqual(['div', 'span']);
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

    it('starts the element with the default text', () => {
      const store = TestBed.inject(BuilderStore);

      store.addElement(store.paletteItems()[0], 0);

      expect(store.canvasElements()[0].text).toBe(DEFAULT_ELEMENT_TEXT);
    });
  });

  describe('updateText', () => {
    it('changes the text of the matching element only', () => {
      const store = TestBed.inject(BuilderStore);
      const [div] = store.paletteItems();
      store.addElement(div, 0);
      store.addElement(div, 1);
      const [first, second] = store.canvasElements();

      store.updateText(second.uid, 'Hello');

      expect(store.canvasElements().map((element) => element.text)).toEqual([first.text, 'Hello']);
    });
  });

  describe('removeElement', () => {
    it('removes the matching element only, keeping the order of the rest', () => {
      const store = TestBed.inject(BuilderStore);
      const [div] = store.paletteItems();
      store.addElement(div, 0);
      store.addElement(div, 1);
      store.addElement(div, 2);
      const [a, b, c] = store.canvasElements().map((element) => element.uid);

      store.removeElement(b);

      expect(store.canvasElements().map((element) => element.uid)).toEqual([a, c]);
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
