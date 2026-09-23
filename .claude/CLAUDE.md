DropUI is a drag & drop ui builder. The user selects a ui element type from the navigation-style menu and drags it in the UI. In that way, the user can create a full client ui just by dragging and dropping on the page.

## Agent behavior

- Don't EVER, under any circumstances git commit anything. You are BANNED from commiting even the tiniest change.


## Architecture

- We use NgRx SignalStore for all state management. Never use RxJS BehaviorSubjects for local state.
- Feature modules follow the feature-driven directory structure: `src/app/features/[feature-name]/`.
- For UI components we use Angular CDK + Angular Aria

## Conventions

- Component (and directive) selectors use the `dui` prefix, never `app`: e.g. `dui-canvas`, `dui-element-palette`. The CLI prefix is set to `dui` in `angular.json`, so `ng generate` produces it automatically.

## Styling

- We use Tailwind and on top of it DaisyUI, which is a tailwind based collection of class names

## Testing

- We use Vitest. Do not generate Karma or Jasmine configuration files.
- All components must have a corresponding `.spec.ts` file utilizing Angular Testing Library, not standard TestBed fixture methods.
