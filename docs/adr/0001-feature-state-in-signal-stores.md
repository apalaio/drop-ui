# ADR 0001: Feature state lives in NgRx SignalStores

- **Status:** Accepted
- **Date:** 2026-10-05
- **Scope:** all application state under `src/app/features/`

This ADR records the store pattern the codebase already follows, so that new features follow it too.

## Context

DropUI is a single-screen builder. The components that need the same data sit in different branches of the component tree:

- the element palette lists the element types that can be dragged;
- the layout panel sets the grid size;
- the canvas renders one drop zone per grid cell;
- each dropped element edits or deletes itself.

Passing this data through inputs and outputs would route every change through the shell component, which has no logic of its own. The app is also zoneless and written with signals throughout, so the state container has to expose signals.

## Decision

Shared state is held in NgRx SignalStores (`@ngrx/signals`). The rules below describe how a store is written and used.

### Where stores live

1. **One store per feature**, in `src/app/features/<feature>/state/<feature>-store.ts`, provided in root. Today there are two: [`BuilderStore`](../../src/app/features/builder/state/builder-store.ts) and [`ThemeStore`](../../src/app/features/theme/state/theme-store.ts).
2. **Stores do not inject each other.** A component that needs two stores injects both.

### How components use a store

3. **Components inject the store directly** and read its signals in the template. A component keeps no state of its own beyond `computed` values derived from the store or from its inputs. RxJS `BehaviorSubject` is never used for state.
4. **A component rendered once per list item takes its item as an input.** `DroppedElement` receives its element from the canvas loop, and still writes through the store.
5. **Components never change state themselves.** SignalStore state is protected by default, so the only way to change it is to call a store method.

### How a store is written

6. **Each method is one `patchState` call with an updater function** that returns new objects and arrays. One user action is therefore one atomic state change.
7. **The store owns its invariants.** It validates and normalises what it is given, and callers pass raw values. Examples: `setGridSize` ignores non-finite numbers and clamps to 1–12; `setTheme` ignores names that are not daisyUI themes; `updateText` ignores an element that has no text.
8. **Derived data is a `withComputed` signal and is never stored.** `BuilderStore.cells` is built from `grid` and `canvasElements`.
9. **Stored state is flat.** `canvasElements` is one array for the whole canvas. Each element carries its `row` and `column`, and the order of two elements in the same cell is their relative order in the array.
10. **Pure helpers are module-level functions above the store** (`createElement`, `insertIntoCell`, `clampGridSize`), so methods stay short and the helpers need no store to reason about.
11. **Side effects go in `withHooks`.** `ThemeStore` starts an `effect` in `onInit` that writes the theme to `<html data-theme>`.
12. **RxJS appears only where a library hands back an Observable**, which today means the `closed` stream of a CDK dialog.

### How stores are tested

A store is tested for real in a `*.spec.ts` through `TestBed.inject` and its public methods. A component test replaces the store with a stub in `providers`. See [the testing guide](../../.claude/guides/testing.md).

## Consequences

**Benefits**

- Any component can read or change builder state without the shell relaying it.
- State transitions are in one file per feature and can be unit-tested without rendering anything.
- A component cannot corrupt state, because it has no write access and the store checks every input.
- `cells` cannot drift from the grid or the element list, because it is recomputed from them.

**Costs and limits**

- **One document at a time.** A root-provided store is a singleton, so two canvases cannot exist side by side without changing how the store is provided.
- **Nothing is persisted.** State is in memory and a reload resets it. Persistence would be added behind the store, not in components.
- **`cells` is recomputed in full on every element or grid change.** It filters the whole element list once per cell. This is fine at the 12 × 12 cap and would need indexing if the cap is raised.
- **Flat storage makes some results depend on history.** When the grid shrinks and two cells merge, the merged order follows the array, which reflects the order of earlier drops and moves.
- **Root stores are created on first injection.** `ThemeStore`'s effect does not run until the theme picker is created, so `index.html` sets the default theme itself to have the first paint themed.
- **Components depend on the concrete store.** Reusing a builder component elsewhere means providing a store with the same shape.

## Alternatives considered

- **Inputs and outputs through the shell.** Rejected: the palette, layout panel, canvas and dropped elements would all communicate through a component with no logic.
- **Plain injectable services holding signals.** Workable, but offers no protected state or standard structure; each service would invent its own.
- **Classic NgRx Store with actions and reducers.** Rejected as too much ceremony for a client-only app with two small state slices.
- **Stores provided per component.** Rejected for now: there is one builder on screen, so a second instance has no use yet.
