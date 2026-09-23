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
});
