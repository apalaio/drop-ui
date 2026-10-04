DropUI is a drag & drop ui builder. The user selects a ui element type from the navigation-style menu and drags it in the UI. In that way, the user can create a full client ui just by dragging and dropping on the page.

## Agent behavior

- Don't EVER, under any circumstances git commit anything. You are BANNED from commiting even the tiniest change.
- Every time a task is completed, run all three test suites (`npm test -- --watch=false`, `npm run test:components -- --watch=false` and `npm run e2e`) and make sure they pass. A task is not done until all tests are green.

## Architecture

- We use NgRx SignalStore for all state management. Never use RxJS BehaviorSubjects for local state.
- Feature modules follow the feature-driven directory structure: `src/app/features/[feature-name]/`.
- For UI components we use Angular CDK + Angular Aria

## Conventions

- Component (and directive) selectors use the `dui` prefix, never `app`: e.g. `dui-canvas`, `dui-element-palette`. The CLI prefix is set to `dui` in `angular.json`, so `ng generate` produces it automatically.

## Comments

- Do not comment on test files
- Comment sparingly if at all
- Comment only on the 'why' a decision was made that is not obvious from the code. Do not comment on implementation that can be seen just by reading the actual code.

## Styling

- We use Tailwind and on top of it DaisyUI, which is a tailwind based collection of class names

## Testing

- Vitest for unit (`*.spec.ts`, jsdom) and component (`*.test.ts`, real Chromium) tests, Playwright for E2E (`*.e2e.ts`). Before writing or running tests, load the `testing` skill: [skills/testing/SKILL.md](skills/testing/SKILL.md).
