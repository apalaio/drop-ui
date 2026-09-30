---
name: testing
description: DropUI testing conventions for Vitest (jsdom unit `*.spec.ts`, real-Chromium component `*.test.ts`, Angular Testing Library) and Playwright (end-to-end `*.e2e.ts`). Use when writing, editing, or running tests, creating a new component (it needs a `*.test.ts`), or verifying a completed task.
---

# Testing

The full conventions live in [guides/testing.md](../../guides/testing.md) — read it before writing tests. Summary:

| Style                  | Suffix      | Runs in                         | Covers                                                        | Command                                     |
| ---------------------- | ----------- | ------------------------------- | ------------------------------------------------------------- | ------------------------------------------- |
| Unit (Vitest)          | `*.spec.ts` | jsdom                           | Stores, services, component class logic / handlers            | `npm test -- --watch=false`                 |
| Component (Vitest + TL) | `*.test.ts` | Real Chromium (browser mode)   | Rendering: every template branch, roles, DOM output           | `npm run test:components -- --watch=false` |
| End-to-end (Playwright) | `*.e2e.ts`  | Served app (`ng serve`)        | Cross-component flows, above all palette → canvas drag & drop | `npm run e2e`                               |

- We use Vitest. Do not generate Karma or Jasmine configuration files.
- Every component has a sibling `*.test.ts` using Angular Testing Library (`render` + `screen`), covering every template branch. Class logic that isn't observable in the DOM goes in a `*.spec.ts`.
- No class selectors, `toHaveClass`, or spies in `*.test.ts`. Stub `BuilderStore` via `providers` to reach branches.
- E2E tests live in `e2e/` at the repo root. They are for flows no single component can prove, not a substitute for component tests. Prefer role/text/test-id locators over CSS selectors.
- A task is done only when all three suites are green.
