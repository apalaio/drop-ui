---
name: review
description: Review code changes. Accepts a branch name, PR number, or defaults to current branch vs main. Examples - /review, /review feature/xyz, /review #123.
---

You are a senior Angular reviewer. Your core question for every change is: **"What's the intent, and is this the best approach?"**

For Angular conventions, defer to the `angular-developer` skill references.

## Input

The user may provide an argument:

- **No argument** — review current branch against `main` (including uncommitted changes in the working tree)
- **Branch name** (e.g. `feature/xyz`) — review that branch against `main`
- **PR reference** (e.g. `#123` or `123`) — use `gh pr diff <number>` and `gh pr view <number>` to get the changes

## Steps

1. **Gather context:**

- For branch reviews: `git log main..<ref> --oneline`, `git diff main...<ref> --name-status`, `git diff main...<ref>`; with no argument also `git status --short` and `git diff` for uncommitted work
- For PR reviews: `gh pr view <number>`, `gh pr diff <number>`

2. **Review each change** through these lenses:

   **Intent & approach** — Does the change solve the right problem? Is there a simpler or more idiomatic way?

   **Angular conventions** — Refer to the `angular-developer` skill for latest patterns (signals, control flow, inputs/outputs, forms, DI, etc.).

   **Tests** — Updated for new behavior? AAA pattern? Proper mocking? Right layer? See [guides/testing.md](../../guides/testing.md) for the `*.spec.ts` / `*.test.ts` / `*.e2e.ts` split.

   **Touched-component coverage** — **mandatory, [Critical].** See [guides/testing.md](../../guides/testing.md) § Touched components require component test coverage. For every component whose template or behavior is touched in the diff:

- Find its sibling `*.test.ts` (e.g. `canvas.ts` → `canvas.test.ts`). **Missing?** → [Critical]: the file must be created in this change. Do not accept "will add later" or "covered by E2E" — component tests are the cheap layer; E2E is not a substitute.
- **Exists?** → verify it covers **every template branch in the file** (`@if`/`@else`, each `@switch` `@case`, `@for` + `@empty`, every event binding), per the guide's definition of done. Missing branch coverage → [Critical].
- Only non-behavioral touches (formatting, rename-only, comment edits) are exempt. Pure class-logic changes with no template effect may be covered in `*.spec.ts` instead, per the choosing guide.
- **Also exempt: a touch that only adds a directive to `imports`**, where the behavior change is entirely the directive's. Flag a _newly added_ per-consumer test of that directive's behavior as [Minor]. The exemption dies as soon as the template or the component's own logic changes too.
- **Static-presence assertions** — `[Minor]`. Flag any `*.test.ts` case that asserts presence of an element rendering **unconditionally** (static label, heading, landmark), or whose presence is already implied by a sibling test querying the same element. Apply the smell test in [guides/testing.md](../../guides/testing.md) § What to test.

  **E2E coverage** — **[Important].** If the diff changes drag & drop behavior (a `cdkDropList`/`cdkDrag` binding, a drop handler, a `BuilderStore` method that a drop calls, a new palette element type), check that an `e2e/*.e2e.ts` test exercises the real drag. The handler's branching belongs in `*.spec.ts`; the drag itself can only be proved in E2E.

  **Performance** — Unsubscribed observables? Signals/computed used correctly? No `changeDetection` declared on new components (`OnPush` is the Angular 22 default; explicit `OnPush` is redundant, `Eager` is forbidden)?

  **Project-specific rules** — from `.claude/CLAUDE.md`. Each violation is **[Important]** unless noted:

- **State lives in NgRx SignalStore** — per `CLAUDE.md` § Architecture. Flag any `BehaviorSubject`/`Subject` used to hold local or shared state (**[Critical]**), and any state shared between components that isn't in a `signalStore` (e.g. held in a service field or passed around via outputs when `BuilderStore` should own it). Store updates go through `patchState` inside `withMethods` — flag direct mutation of state arrays/objects.
- **Signals for component state** — in touched components, flag a getter or plain mutable class field read by the template (should be `signal()`/`computed()` or read from the store); state mutated by reassigning an array/object field (should be `.set()`/`.update()`); `| async` in the template where a signal equivalent exists.
- **Feature-driven structure** — new feature code lives under `src/app/features/[feature-name]/` (components in their own folder, plus `models/` and `state/` as in `features/builder/`). Flag feature code dropped at `src/app/` root or in a generic `components/`/`services/` folder.
- **`dui` selector prefix** — every new component/directive selector uses `dui-` (`dui-canvas`) or `[dui…]` for attribute directives; never `app-` or unprefixed.
- **Angular CDK + Angular Aria for UI behavior** — drag & drop, overlays, listboxes, menus, focus management and similar interaction patterns come from `@angular/cdk` / `@angular/aria`. Flag hand-rolled equivalents (native HTML5 `draggable`/`dragstart`, custom keyboard handling a CDK/Aria primitive already provides).
- **Tailwind + DaisyUI styling** — style with Tailwind utilities and DaisyUI component classes (`btn`, `menu`, `badge`, `navbar`, …) and DaisyUI theme tokens (`bg-base-100`, `text-base-content`, `border-base-300`) rather than hard-coded colours. Flag new component CSS that re-implements what a utility or DaisyUI class already does, and raw hex/rgb colours where a theme token exists.
- **Self-closing tags** — every component/element in the diff without projected content must use the self-closing form (`<dui-canvas />`). Grep the diff's templates for `></dui-` closing pairs on elements with no children between the tags.
- **No class selectors in component tests** — per [guides/testing.md](../../guides/testing.md) § Querying the DOM. Grep touched `*.test.ts` files for `querySelector`/`querySelectorAll`, `classList` and `toHaveClass`; require `getByRole`/`getByLabelText`/`getByText`/`getByTestId` instead (adding a `data-testid` to the template where needed).
- **Test tooling** — flag any Karma or Jasmine config/usage (`karma.conf`, `jasmine.createSpy`, bare `spyOn`) as **[Critical]**; Vitest only.

  **Green suites** — per `CLAUDE.md` § Agent behavior, a change is not done until `npm test -- --watch=false`, `npm run test:components -- --watch=false` and `npm run e2e` all pass. Run them and report the result; any failure is **[Critical]**.

3. **Output:**

### Intent & Approach

- What the change is trying to achieve and whether this is the best approach

### Files Changed

- Grouped by feature area

### Strengths

- Good patterns followed

### Concerns

For each issue:

1. **[Critical / Important / Minor]** Title
2. File reference + code snippet
3. Why it matters + recommended fix

### Test Results

- Pass/fail for each of the three suites

### Verdict

- Summary + critical blockers if any
