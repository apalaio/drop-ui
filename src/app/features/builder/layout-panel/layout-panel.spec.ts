import { Signal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GridLayout } from '../models/grid-layout';
import { BuilderStore } from '../state/builder-store';
import { LayoutPanel } from './layout-panel';

describe('LayoutPanel', () => {
  let store: { grid: Signal<GridLayout>; setGridSize: ReturnType<typeof vi.fn> };
  let panel: HTMLElement;

  beforeEach(() => {
    store = { grid: signal({ rows: 1, columns: 1 }), setGridSize: vi.fn() };
    TestBed.configureTestingModule({ providers: [{ provide: BuilderStore, useValue: store }] });
    const fixture = TestBed.createComponent(LayoutPanel);
    fixture.detectChanges();
    panel = fixture.nativeElement;
  });

  function inputLabelled(label: string): HTMLInputElement {
    const input = panel.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`);
    if (!input) throw new Error(`No input labelled "${label}"`);
    return input;
  }

  function type(label: string, value: string): void {
    const input = inputLabelled(label);
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function commit(label: string): void {
    inputLabelled(label).dispatchEvent(new Event('change', { bubbles: true }));
  }

  it.each([
    { label: 'Grid rows', axis: 'rows' },
    { label: 'Grid columns', axis: 'columns' },
  ])('sets only the grid $axis to the number committed in the $label input', ({ label, axis }) => {
    type(label, '5');
    commit(label);

    expect(store.setGridSize.mock.calls).toEqual([[axis, 5]]);
  });

  it('leaves the grid unchanged while a number is typed but not yet committed', () => {
    type('Grid rows', '1');
    type('Grid rows', '12');
    type('Grid columns', '3');

    expect(store.setGridSize).not.toHaveBeenCalled();
  });

  it('commits only the final number, not the ones typed on the way to it', () => {
    type('Grid rows', '1');
    type('Grid rows', '12');
    commit('Grid rows');

    expect(store.setGridSize.mock.calls).toEqual([['rows', 12]]);
  });
});
