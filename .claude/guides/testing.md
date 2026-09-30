# Testing

> **Purpose:** When to write a `*.spec.ts`, a `*.test.ts`, or a Playwright `*.e2e.ts`, and how to write each.
> **Last updated:** 2026-09-30

---

## Three test styles

Unit and component tests run on **Vitest** through Angular's `@angular/build:unit-test` builder; end-to-end tests run on **Playwright**. The file suffix indicates **both** the testing style and the environment.

| Style                   | File suffix | Environment                                    | What it tests                                                       | Command                                     |
| ----------------------- | ----------- | ---------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------- |
| Vitest + TestBed        | `*.spec.ts` | `jsdom`                                        | Stores, services, pipes, guards, component **class** logic          | `npm test -- --watch=false`                 |
| Vitest + Testing Library | `*.test.ts` | Real Chromium via `@vitest/browser-playwright` | Component **rendering** — template branches, DOM output, a11y roles | `npm run test:components -- --watch=false` |
| Playwright              | `*.e2e.ts`  | The served app (`ng serve`) in Chromium        | Cross-component user flows — above all palette → canvas drag & drop | `npm run e2e`                               |

Wiring: the `test` and `test-components` targets in `angular.json` (with `tsconfig.spec.json` / `tsconfig.test.json`), and `playwright.config.ts` for E2E. Both Vitest targets load [`src/test-setup.ts`](../../src/test-setup.ts), which registers the `@testing-library/jest-dom` matchers (`toBeInTheDocument`, `toHaveAttribute`, …); the browser target first loads [`src/test-setup.browser.ts`](../../src/test-setup.browser.ts), which shims the `process` global those matchers expect.

---

## Choosing a runner

| If the test asserts on…                                          | Write it as                                                                                          |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| A store method or service transforming inputs to outputs         | `*.spec.ts`                                                                                          |
| A guard or interceptor's branching                               | `*.spec.ts`                                                                                          |
| A component's own `output()` emitting, with no DOM change        | `*.spec.ts` — subscribe to the output, drive the handler, assert it emitted                          |
| A component handler's branching (e.g. `Canvas.drop` add vs move) | `*.spec.ts` — call the handler with a fake event, assert on the injected store                       |
| Rendered text, button labels, `@if`/`@for`/`@switch` branches    | `*.test.ts`                                                                                          |
| Aria roles, form-control accessibility, empty-state rendering    | `*.test.ts`                                                                                          |
| A template `(click)` binding with a visible/observable result    | `*.test.ts` — fire the event and assert the observable effect, never a spy on a method or dependency |
| A click that triggers a store/service call (internal side-effect only) | `*.spec.ts`                                                                                    |
| A flow spanning several components — dragging from the palette onto the canvas, reordering on the canvas | `*.e2e.ts`                                                    |

When in doubt: if you would assert on a DOM node or user interaction in one component's template, write a `*.test.ts`. If you would mock the DOM out entirely, write a `*.spec.ts`. If the behaviour only exists when several components and real pointer events work together, write a `*.e2e.ts`.

**A store, service, guard, pipe, or interceptor never gets a `*.test.ts`.** There is no template to render, so the browser runner has nothing to assert. Unit-test its logic in a `*.spec.ts`; if it has browser-only side effects, those are proved by the `*.test.ts` of the **component that consumes it**.

**A route-config file (`app.routes.ts`, a feature's `routes.ts`) gets no test of its own.** A `Routes` array is declarative configuration: a test that re-reads it only restates the config in a second place. If a route carries real behaviour (a guard), prove it by navigating the real router in the guard's `*.spec.ts`.

### When a directive needs both

Normally one style is enough. A directive applied **by its selector** rather than by an attribute is the exception: it carries a `*.spec.ts` for its logic through a plain host, and a `*.test.ts` proving that the **selector matches** the real elements it targets. Selector matching is not observable in jsdom against a stubbed host, and together these two files are why consumers do **not** each retest the directive (see [What to test](#what-to-test)).

### E2E is for flows, not coverage

Component tests (`*.test.ts`) are the deliberately cheap layer — fast to write, fast to run — and they carry the per-component coverage bar. E2E is **not** a substitute for them: a component's branches are covered in its `*.test.ts` even when an E2E test happens to pass through them. Reserve `*.e2e.ts` for what no single component can prove:

- Drag & drop between the palette and the canvas (CDK drag relies on real pointer events and layout, which a single-component render doesn't have).
- Reordering dropped elements on the canvas.
- Any flow whose result depends on several components sharing state through the `BuilderStore`.

E2E conventions:

- Tests live in `e2e/` at the repo root and are named `*.e2e.ts` — never `*.spec.ts` or `*.test.ts`, which are reserved for Vitest.
- Playwright starts `ng serve` on `http://localhost:4200` automatically (or reuses one already running).
- Prefer role/text locators (`page.getByRole`, `page.getByText`, `page.getByTestId`) over CSS selectors.

---

## Writing a Vitest unit test (`*.spec.ts`)

Use Angular's `TestBed` directly with Vitest's `vi`. Globals (`describe`, `it`, `expect`, `vi`, `beforeEach`, etc.) are available without importing (`vitest/globals` is in `tsconfig.spec.json`).

```ts
import { TestBed } from '@angular/core/testing';
import { BuilderStore } from '../state/builder-store';
import { Canvas } from './canvas';

describe('Canvas', () => {
  let store: { addElement: ReturnType<typeof vi.fn>; moveElement: ReturnType<typeof vi.fn> };
  let canvas: Canvas;

  beforeEach(() => {
    store = { addElement: vi.fn(), moveElement: vi.fn() };
    TestBed.configureTestingModule({ providers: [{ provide: BuilderStore, useValue: store }] });
    canvas = TestBed.runInInjectionContext(() => new Canvas());
  });

  it('reorders an element dragged within the canvas', () => {
    // …call canvas['drop'](fakeEvent) and assert on the store
  });
});
```

A SignalStore under test is injected for real (`TestBed.inject(BuilderStore)`) and driven through its methods — see [`builder-store.spec.ts`](../../src/app/features/builder/state/builder-store.spec.ts).

### Key conventions for `*.spec.ts`

| Convention                                  | Detail                                                                                                                                                                                                                                                                                |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Spies                                       | `vi.spyOn(...)` / `vi.fn()` — not `jasmine.createSpy` or `spyOn`                                                                                                                                                                                                                     |
| Signal effects                              | `fixture.detectChanges()` → `TestBed.flushEffects()` → `fixture.detectChanges()`                                                                                                                                                                                                     |
| Inputs                                      | `fixture.componentRef.setInput('name', value)` before `fixture.detectChanges()`                                                                                                                                                                                                      |
| Mock providers                              | `{ provide: MyService, useValue: { method: () => of(value) } }` in `providers`                                                                                                                                                                                                       |
| A mock the component fetches from a service | Hand out **one instance per test** (reassigned in `beforeEach`) and spy on that. A factory returning a fresh object per call silently discards your spies the moment the component re-fetches — and never assign over the component's own field to get around it                |
| Per-test timeouts                           | Don't add. A slow test is too slow, not under-budgeted                                                                                                                                                                                                                                |

---

## Writing a Vitest component test (`*.test.ts`)

Use Testing Library's `render` from `@testing-library/angular` and query through `screen`.

```ts
import { signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { CanvasElement } from '../models/canvas-element';
import { BuilderStore } from '../state/builder-store';
import { Canvas } from './canvas';

describe(Canvas.name, () => {
  const dropHint = 'Drop elements here';
  const element: CanvasElement = { uid: 'element-1', type: 'div', paletteUid: 'palette-div' };

  async function mount(canvasElements: CanvasElement[]) {
    return render(Canvas, {
      providers: [{ provide: BuilderStore, useValue: { canvasElements: signal(canvasElements) } }],
    });
  }

  describe('with dropped elements', () => {
    beforeEach(async () => mount([element]));

    it('should not render the drop hint', () => {
      expect(screen.queryByText(dropHint)).not.toBeInTheDocument();
    });
  });

  describe('without dropped elements', () => {
    beforeEach(async () => mount([]));

    it('should render the drop hint', () => {
      expect(screen.getByText(dropHint)).toBeInTheDocument();
    });
  });
});
```

### Setup

| Convention                                | Detail                                                                                                                                         |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Import the component from a relative path | `import { Canvas } from './canvas'`                                                                                                            |
| Define named constants for test data      | Declare `const label = 'some-label'` at the top of `describe` — no magic strings in assertions                                                 |
| Stub the store via `providers`            | `{ provide: BuilderStore, useValue: { canvasElements: signal([...]) } }` — the stubbed store is the "world" the component renders; see [§ Drive branches](#drive-branches-never-set-state) |
| Stub observables, not plain values        | `of(value)` for success, `EMPTY` for never-emits, `throwError(() => new Error())` for errors                                                   |

`render` options used in practice:

| Option               | Type         | Purpose                                                                  |
| -------------------- | ------------ | ------------------------------------------------------------------------ |
| `inputs`             | `Partial<C>` | Sets component `input()` values                                          |
| `providers`          | `Provider[]` | DI overrides — use to stub the store and services                        |
| `componentProviders` | `Provider[]` | Component-injector overrides — needed when an imported module shadows the token |
| `imports`            | `NgModule[]` | Extra Angular modules                                                    |

### Test structure

| Convention                      | Detail                                                                                                                                                                |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Top-level `describe`            | Use `ComponentName.name` as the string                                                                                                                                |
| Nested `describe`               | Group by element or scenario — e.g. `'with dropped elements'`, `'without dropped elements'`                                                                           |
| Every `it` starts with `should` | `it('should render the drop hint', ...)`                                                                                                                              |
| One thing per `it`              | Each `it` tests one specific element or behaviour. Small, focused tests make failures immediately obvious to fix                                                      |
| Shared setup                    | Use `beforeEach(async () => mount(...))` when multiple `it` blocks in a `describe` share the same mount                                                               |

### Querying the DOM

**DO**

| Query                                                                   | When to use                                                                                                |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `screen.getByText('...')`                                               | Element has visible text and you are asserting presence                                                    |
| `screen.getByRole('link' \| 'button' \| 'heading', { name: /label/i })` | Element has an ARIA role; add `{ name }` when multiple elements share the same role                        |
| `screen.getByTestId('x')`                                               | Non-text element (a dropped `<div>`, icon, spinner) — asserting presence. Add `data-testid` to the template if missing |
| `screen.queryByText` / `screen.queryByRole` / `screen.queryByTestId`    | Asserting **absence** — `queryBy*` returns `null` instead of throwing                                      |
| `screen.getAllByRole` / `screen.getAllByTestId`                         | Multiple elements of the same role or test id — asserting all are present. Throws if none found.           |
| `screen.queryAllByRole` / `screen.queryAllByTestId`                     | Multiple elements — asserting all are absent. Returns `[]` instead of throwing.                            |

**DON'T**

| What to avoid                                                                                                                                                                           | Why                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CSS class selectors of any kind, via **any** root — `container.querySelector('.some-class')`, `document.querySelector('.some-class …')`, `fixture.nativeElement.querySelector(…)`, etc. | Couples tests to class names (Tailwind/DaisyUI utilities, `cdk-drag`, `cdk-drop-list`), which are implementation details and break on markup refactors. If the element has no role, text, or test id to query by, add a `data-testid` to the template — never fall back to a class selector.                                                                                                                                                               |
| `toHaveClass` / `classList` — always. `toHaveAttribute` for styling or wiring internals                                                                                                  | Tests technical internals, not what the user sees. `toHaveAttribute` **is** correct for state the user or a screen reader observes — `aria-expanded`, `aria-current`, `aria-selected`, `aria-disabled`, `aria-labelledby`, `role`, `placeholder` — and for purpose-built `data-*` hooks such as `data-uid` / `data-element-type`. Prefer `toBeDisabled()` / `toBeChecked()` / `toHaveValue()` where they exist. |
| Spy assertions (`expect(spy).toHaveBeenCalled…`) on component methods or injected dependencies                                                                                          | A `*.test.ts` asserts the **rendered outcome**, never that a call happened. If an interaction's only effect is a dependency call with nothing visible, it is not a component-test case — move it to the `*.spec.ts` (see § Choosing a runner). Stubbing a dependency in `providers` to isolate the test is fine; asserting on the stub is not.                                                                                                                              |
| `getBy*` for absence checks                                                                                                                                                             | `getBy*` throws before the assertion runs — use `queryBy*` instead                                                                                                                                                                                                                                                                                                                                                                                                          |

**The one class-selector exception: CDK-overlay-generated elements.** The class-selector ban is about coupling to _our own_ markup. It does **not** apply to the elements the CDK overlay creates outside any template we control — the backdrop (`.cdk-overlay-backdrop`) and the positioning box (`.cdk-overlay-connected-position-bounding-box`). These have no role, text, or `data-testid` we can add, so a class selector is the only handle — reach for it only to click a backdrop, assert its presence/absence, or read overlay geometry.

### Assertions

- Always leave a blank line before `expect(...)` or a block of `expect` calls.
- All `getBy*` calls — always wrap in `expect(...).toBeInTheDocument()`.
- `getAllByRole` / `getAllByTestId` — always use `expect(screen.getAllByRole('x').length).toBe(n)` to assert an exact count. Calling either bare looks like an assertion but isn't — it only throws on zero matches.
- Never use `getByTestId` and `getByText` on the same element — that tests the same thing twice.
- For absence of a single element, wrap `queryBy*` in `expect(...).not.toBeInTheDocument()`.
- For absence of all elements of a role, use `expect(screen.queryAllByRole('x').length).toBe(0)`.

```ts
// DO
expect(screen.getByText(label)).toBeInTheDocument();
expect(screen.getByTestId('dropped-div')).toBeInTheDocument();
expect(screen.queryByTestId('dropped-div')).not.toBeInTheDocument();

// DON'T
screen.getByText(label); // missing toBeInTheDocument
expect(screen.getByRole('list').classList).toContain('cdk-drop-list'); // class assertion
```

### What to test

Component tests cover the **happy flow**. Error flows (service errors, validation failures, edge cases) belong in `*.spec.ts` unit tests, where methods can be called directly and assertions are not coupled to the DOM.

**One coverage bar: the whole file.** Touching a component _at all_ requires its `*.test.ts` to thoroughly cover **every template branch in the file** — not just the branch you happened to change. If the file doesn't exist yet, create it; if it exists but is partial, fill it out to full coverage as part of your change.

**Definition of done for a component test file:** every branch in the template is exercised. Before calling it done, enumerate the template and confirm each of these has a test:

- Every `@if` / `@else if` / `@else` block — assert it renders when its condition is true **and** is absent when false.
- Every `@switch` `@case` and `@default` — one `it` each, asserting the other cases are absent. (`DroppedElement`'s `@switch (element().type)` gains a case per new element type — each one needs its `it`.)
- Every `@for` block — assert it renders rows for a populated list **and** the `@empty` block (or empty state) for an empty one.
- Every template `(click)` (and other event) binding — fire it and assert the effect.

If a branch genuinely belongs in a `*.spec.ts` (error/validation flow, service-call assertion), cover it there instead and don't duplicate it here — but it must be covered _somewhere_, not skipped. CDK drag-and-drop outputs such as `(cdkDropListDropped)` are the standing example: the handler's logic is covered in the `*.spec.ts`, the real drag in a `*.e2e.ts`.

**DO**

- Test `@if` / `@else` branches: what renders when a condition is true, and that it is absent when false. When a single condition controls multiple elements of the same role, assert the whole group with `getAllByRole` / `queryAllByRole` — not just one representative.
- Test `@switch` cases: one `it` per `@case`, and one for `@default` if present.
- Test template `(click)` bindings by firing the event and asserting the **observable effect** — never by spying on the component's own method or an injected dependency.
- When a callback is **passed into** the component as data (a parent-supplied handler input), that callback _is_ the component's contract — assert it fired with `vi.fn()`. **A component's own `output()` is not this case** — see [§ Outputs and method calls](#outputs-and-method-calls-belong-in-a-spects).

**DON'T**

| What to skip                                                                                                                                             | Why                                                                                                                                                                                                                                                  |
| -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Error states                                                                                                                                             | Cover in `*.spec.ts` — call the method directly and assert on the result                                                                                                                                                                             |
| Static HTML outside `@if` / `@else`                                                                                                                      | It always renders — there is no branch to verify                                                                                                                                                                                                     |
| Reaching a branch by mutating the component's own state (`fixture.componentInstance.someSignal.set(...)`, assigning a field, `formControl.setValue(...)`) | Tests state you injected, not the path that produces it. Reach the branch via `inputs`, stubbed `providers`, or a user event. See [§ Drive branches, never set state](#drive-branches-never-set-state).                                               |
| Spying on the component's **own** methods and asserting `toHaveBeenCalled`                                                                               | Tests the wiring, not the behavior. See [§ Never spy in a component test](#never-spy-in-a-component-test).                                                                                                                                          |
| Whether an injected dependency was called (store method, `Router`, …)                                                                                     | Assert the user-visible result instead. Cover the call itself in a `*.spec.ts`.                                                                                                                                                                      |
| CSS classes, CDK marker classes (`cdk-drag`, `cdk-drop-list`), or other technical details                                                                | Test what the user sees. Whether something is draggable is proved by dragging it — in a `*.e2e.ts`.                                                                                                                                                 |
| Whether a component's own `output()` emitted                                                                                                             | Cover it in a `*.spec.ts`. See [§ Outputs and method calls](#outputs-and-method-calls-belong-in-a-spects).                                                                                                                                          |
| DOM effects produced by a directive applied to the template                                                                                              | The directive has its own test — trust it.                                                                                                                                                                                                          |

**Smell test for a presence assertion.** Before keeping any `expect(screen.getBy…(…)).toBeInTheDocument()`, delete the line and ask: _which template branch now goes untested?_ If the answer is "none" — the element renders unconditionally (a static label, heading, landmark), or its presence is already implied by a sibling test that queries the same element — then it was a **static-presence assertion**. Leave it deleted.

### Variant classes belong in a `*.spec.ts`

Some inputs produce **nothing** a browser can observe except a modifier class (`variant`, `size`, `intent`). Asserting them in a `*.test.ts` is a class-name assertion (banned above); deleting them loses real logic when the mapping is a `computed` with rules in it. So they move down a layer: the `*.spec.ts` asserts the input → class mapping via `TestBed.createComponent` + `setInput` + `classList`.

If the state is genuinely dynamic behaviour whose only DOM output is a class, add a purpose-built `data-*` attribute alongside the class and assert that instead.

### Outputs and method calls belong in a `*.spec.ts`

A `*.test.ts` asserts only what the DOM renders. Two things it must **not** assert:

- **That a component's own `output()` emitted.** Cover it in the `*.spec.ts`: subscribe to the `output()` and call the handler directly, then assert the `vi.fn()` fired. Prefer a one-line handler method over emitting inline in the template, so the emission is reachable without rendering.
- **That a method was called.** Never `vi.spyOn(component, 'x')` — see [§ Never spy in a component test](#never-spy-in-a-component-test).

### Drive branches, never set state

A component test reaches a template branch the way a user reaches it — never by reaching into the instance and flipping the state the branch depends on.

| To reach a branch that depends on…                    | Drive it with…                                                                                                                     |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| An `input()`                                          | `render(C, { inputs: { … } })`                                                                                                     |
| Store state (`BuilderStore`) or service data          | A stubbed **provider** — e.g. `{ provide: BuilderStore, useValue: { canvasElements: signal([...]) } }`. Configuring the world is not poking internals. |
| A user action (touched form, toggled flag, set value) | Fire the **event** — `fireEvent.click(...)`, type into the field — and let the component update its own state                      |
| A loading / disabled state                            | Hold the request open with a `Subject`, click the action, assert `toBeDisabled()` during and `toBeEnabled()` after                 |

If a branch is genuinely unreachable through inputs, providers, or events, it does **not** get faked by setting the signal — cover the underlying logic in a `*.spec.ts` instead. A `*.spec.ts` _may_ set signals and call methods directly; a `*.test.ts` may not.

### Never spy in a component test

Spying — whether on the component's **own** method or on an **injected dependency** — and asserting it was called tests the wiring and nothing else. Replace every `vi.spyOn(...)` + `toHaveBeenCalled` in a `*.test.ts` with an assertion on the **observable effect**:

| The interaction…                   | Assert on…          | How                                                                                                                                  |
| ---------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Renders or removes something       | The DOM             | `getByText` / `getAllByTestId(...)` / `queryAllByTestId(...)` count                                                                  |
| Toggles a loading / disabled state | The button or field | Hold the request open with a `Subject`, then `expect(button).toBeDisabled()` during the call and `toBeEnabled()` after it completes |
| Navigates                          | The resulting URL   | Register the destination route in `provideRouter([...])`, click, `await fixture.whenStable()`, then `expect(TestBed.inject(Router).url).toBe(...)` |

If an interaction's only effect is a dependency call with nothing visible, that belongs in a `*.spec.ts`: drive the class directly there and spy on the **injected dependency** (never on the component's own method).

**For navigation, assert the destination URL** — never a spy on `Router.navigate`. Register the destination as a stub route:

```ts
@Component({ selector: 'dui-blank', template: '' })
class BlankComponent {}

provideRouter([{ path: 'preview', component: BlankComponent }]),
```

### Debugging

```ts
screen.debug(); // full DOM
screen.debug(screen.getByTestId('x')); // scoped to one element
```

---

## Touched components require component test coverage

| Situation                                                                  | Requirement                                                                                       |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| A component's template or behavior is touched and a `*.test.ts` exists     | Bring the file to **full-file coverage** — every template branch, not only the branch you changed |
| A component's template or behavior is touched and **no** `*.test.ts` exists | The file must be **created** in the same change with **full-file coverage**                     |
| Touch is non-behavioral (formatting, rename-only, comment edits)           | No new coverage required                                                                          |
| Touch **only adds a directive to `imports`** and the behavior is the directive's | No new coverage required — the directive's own tests own it                                 |

The imports-only exemption is narrow by design: change the template or the component's own logic in the same change and the full-file rule applies again. Pure class-logic changes follow [§ Choosing a runner](#choosing-a-runner) — they may belong in `*.spec.ts` — but anything observable in the rendered template lands in `*.test.ts`.

### Exemption: sweeping mechanical changes

The full-file rule is calibrated for **feature work**. It does **not** apply to a **sweeping, behavior-preserving mechanical change** applied uniformly across many components (a framework-migration codemod, a repo-wide rename, a formatting sweep), under all of these conditions:

| Condition                       | Requirement                                                                                                                                         |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Qualifies**                   | The edit is the **same mechanical, behavior-preserving transform** across **many** components. A normal multi-file feature does **not** qualify.   |
| **Compile-safe**                | `npm run build` passes — the type-checked template compile is the safety net that replaces per-file tests.                                          |
| **Behavior changes carved out** | Any file where the change is **not** purely mechanical still owes full-file coverage, and a bug fix still owes its [regression test](#bug-fixes). |

When in doubt about whether a change is "mechanical", it isn't.

---

## Bug fixes

Every bug fix requires a **regression test**. If the bug was in template rendering, the regression test belongs in `*.test.ts`. If it was in a store/service/handler, it belongs in `*.spec.ts`. If it only shows up across components (a drop landing at the wrong index), it belongs in `*.e2e.ts`.
