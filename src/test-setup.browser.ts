// jest-dom's matchers read `process` (via picocolors), which doesn't exist in the browser runner.
// Must run before src/test-setup.ts, so it is listed first in the test-components setupFiles.
(globalThis as { process?: unknown }).process ??= { env: {}, argv: [], platform: 'browser' };
