# ADR 0002: Canvas elements are a discriminated union

- **Status:** Accepted
- **Date:** 2026-10-05
- **Scope:** [`canvas-element.ts`](../../src/app/features/builder/models/canvas-element.ts) and everything that reads or creates a canvas element

## Context

A canvas element is one instance the user has dropped on the canvas. Until this change, every element had the same shape whatever its type:

```ts
export interface CanvasElement {
  uid: string;
  type: ElementType; // 'div' | 'span' | 'text-input' | 'textfield' | 'datepicker' | 'dropdown'
  paletteUid: string;
  text: string;
  options?: DropdownOption[];
  row: number;
  column: number;
}
```

That was adequate for `div` and `span`. Adding form elements exposed three problems:

- **Fields existed where they meant nothing.** Datepickers and dropdowns were stored with the text "enter text", which neither renders.
- **Fields were absent where they mattered.** A new dropdown had `options` undefined, so readers had to treat "no list" and "empty list" as separate cases.
- **The model did not say which type has which field.** That rule was kept outside it, in a hand-maintained set of "textless" types in the component. `updateText` on a datepicker and `updateOptions` on a span both type-checked and both succeeded.

More element types with their own properties are expected, so each new one would have widened the flat shape further.

## Decision

`CanvasElement` is a union of interfaces. Each interface extends a shared base and names the element types it covers, so `type` is the discriminant:

```ts
interface BaseCanvasElement<T extends ElementType> {
  uid: string;
  type: T;
  paletteUid: string;
  row: number;
  column: number;
}

export interface TextCanvasElement extends BaseCanvasElement<
  'div' | 'span' | 'text-input' | 'textfield'
> {
  text: string;
}

export interface DatepickerCanvasElement extends BaseCanvasElement<'datepicker'> {}

export interface DropdownCanvasElement extends BaseCanvasElement<'dropdown'> {
  options: DropdownOption[];
}

export type CanvasElement = TextCanvasElement | DatepickerCanvasElement | DropdownCanvasElement;
```

The rules that go with it:

1. **The base is not exported.** Code outside the model file uses `CanvasElement` or one of the concrete interfaces.
2. **An interface is grouped by fields, not by type.** Four types share `TextCanvasElement` because they carry the same data. A type gets its own interface when its fields differ.
3. **Type-specific fields are required.** A dropdown always has an `options` array, which starts empty.
4. **Elements are created in one place.** `createElement` in [`builder-store.ts`](../../src/app/features/builder/state/builder-store.ts) switches on the type and returns the right shape. It has no `default` branch, so a type without a case fails to compile.
5. **Code narrows before using a type-specific field**, with `element.type === 'dropdown'` or `'text' in element`.
6. **Store updates ignore elements of the wrong kind.** `updateText` changes only elements that have text; `updateOptions` changes only dropdowns.
7. **Component methods take the narrowed element.** `editText(element: TextCanvasElement)` and `editOptions(element: DropdownCanvasElement)` cannot be called with the wrong kind.
8. **The template narrows a local variable and checks exhaustiveness.** [`dropped-element.html`](../../src/app/features/builder/dropped-element/dropped-element.html) reads the input once with `@let el = element();`, switches on `el.type`, and ends with `@default never(el);`.

### Adding an element type

1. Add the name to `ElementType` in [`palette-item.ts`](../../src/app/features/builder/models/palette-item.ts).
2. Add an interface extending `BaseCanvasElement<'new-type'>`, or add the name to an existing interface that has the same fields. List a new interface in the `CanvasElement` union.
3. Fix what the compiler reports: the `HOVER_OUTLINE` record, the `createElement` switch, and the template `@switch`.
4. Add the palette entry to the store's initial state, and to the list the store spec expects. Nothing flags a missing entry: the type simply cannot be dragged onto the canvas.

## Consequences

**Benefits**

- An element holds only the fields its type uses, which is also the shape that would be saved once the canvas is persisted.
- Misuse is a compile error: reading `options` on a non-dropdown, calling `editText` with a datepicker, or adding a type without handling it.
- The "which types have text" rule is the model itself. The separate set of textless types is gone.

**Costs and things to know**

- **Element types are named in two places**, `ElementType` and the interfaces. The compiler keeps them in step, but both must be edited.
- **Reading a type-specific field takes a narrowing step** that the flat shape did not need.
- **The template must narrow a local variable.** Narrowing does not carry across repeated `element()` calls, hence `@let el`. The exhaustiveness check must name that variable: plain `@default never;` checks `el.type`, which fails to compile because `el` itself has already narrowed to `never`.
- **Test fixtures must be built per kind.** `{ ...div, type: 'dropdown', options }` compiles, because spreading skips excess-property checks, but the object still carries `text` at runtime and `'text' in element` is then true for a dropdown.
- **Creating an element is a switch rather than one object literal.**

## Alternatives considered

- **Keep the flat interface and add optional fields.** Rejected for the three problems described in Context, which grow with each new type.
- **One interface per element type.** Rejected: `div`, `span`, `text-input` and `textfield` would be four identical interfaces. Grouping by fields keeps the union short, and a type can be split out later without touching the others.
- **Derive `ElementType` from the union (`CanvasElement['type']`).** This would leave one place to name a type. Not done because `ElementType` is defined with the palette model, which the element model imports; reversing that dependency was not worth it at this size.
- **A generic `props` bag per element.** Rejected: it moves the type-specific fields out of sight of the type checker, which is the problem this decision solves.
