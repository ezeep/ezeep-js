# Testing

This project uses Stencil's built-in test runner (Jest for unit/spec tests,
Puppeteer for e2e). Tests live next to the code they cover.

## Running tests

| Command | What it runs |
| --- | --- |
| `npm test` | Unit + component **spec** tests (`*.spec.ts`/`*.spec.tsx`). Fast, no browser. |
| `npm run test.watch` | Spec tests in watch mode. |
| `npm run test.coverage` | Spec tests with a coverage report. |
| `npm run test.e2e` | **E2E** tests (`*.e2e.ts`) in headless Chromium via Puppeteer. |
| `npm run test.all` | Spec + e2e together. |

CI runs `npm run lint`, `npm test`, `npm run test.e2e`, and `npm run build` on
every PR (see [.github/workflows/node.js.yml](.github/workflows/node.js.yml)).

## What's covered today

**Spec tests (40):**

- [src/utils/printer.spec.ts](src/utils/printer.spec.ts) — `applyPrinterDefaults`,
  `classifyJobStatus`, tray detection. The core of the print-config → properties
  mapping and the job-status state machine.
- [src/utils/utils.spec.ts](src/utils/utils.spec.ts) — form encoding, page-range
  validation/formatting, paper-dimension handling.
- [src/shared/storage.spec.ts](src/shared/storage.spec.ts) — the `localStorage`
  wrapper, including the legacy key names and corrupt-JSON handling.
- [src/services/auth.spec.ts](src/services/auth.spec.ts) — **PKCE**: verifier
  entropy/charset, deterministic S256 challenge, auth-URI construction.
- [src/components/ezp-stepper/ezp-stepper.spec.tsx](src/components/ezp-stepper/ezp-stepper.spec.tsx)
  — bounded increment/decrement + `stepperChanged` emission (`newSpecPage`).
- [src/components/ezp-status/ezp-status.spec.tsx](src/components/ezp-status/ezp-status.spec.tsx)
  — conditional rendering + event payloads (`newSpecPage`).

**E2E tests (2):**

- [src/components/ezp-status/ezp-status.e2e.ts](src/components/ezp-status/ezp-status.e2e.ts)
  — renders in a real browser and verifies a click → `statusClose` event.

## Conventions

- **Pure logic** (anything in `utils/`, `shared/`, services) → plain spec tests.
  Prefer testing extracted pure functions over reaching into components.
- **Component rendering / state** → `newSpecPage` spec tests (jsdom, fast).
- **Real-browser behaviour** (clicks, focus, shadow DOM, layout) → `*.e2e.ts`
  with `newE2EPage`.
- A test that needs a private method can use `page.rootInstance as any` — keep
  these to behaviour that isn't reachable through the public DOM/props.

## Notes & gotchas

- The e2e dev server inherits the HTTPS dev-server config (self-signed cert), so
  `stencil.config.ts` sets `testing.browserArgs` with `--allow-insecure-localhost`
  and `--no-sandbox` (the latter is required for headless Chromium in CI).
- The global script loads a remote webfont; that fetch is wrapped in a `.catch`
  so a blocked/offline network never breaks rendering (or e2e).

## Future direction (automated testing)

Stencil prints a deprecation warning: its integrated `--spec`/`--e2e` runner is
removed in **Stencil v5**. The migration path is:

- Spec/unit → [`@stencil/vitest`](https://github.com/stenciljs/vitest)
- E2E / browser → [`@stencil/playwright`](https://github.com/stenciljs/playwright)

**Status (2026-07): deliberately deferred.** Investigated and it is *not* a
runner swap:

- Stencil 5 is **alpha-only** (`5.0.0-alpha.*`); latest stable core is `4.43.5`.
  We will not put an alpha framework into production.
- `@stencil/vitest` replaces `newSpecPage` with a different `render()` API and
  requires loading **built** components — it does **not** support `newSpecPage`.
  Running our current specs under plain Vitest fails at the `@Prop` decorator
  (the Stencil compiler transform isn't applied), so ~100 component tests would
  need a full rewrite to the black-box `render()` model (no private-method
  access).
- `@stencil/playwright` is still `0.4.x`.

Plan: revisit when **Stencil 5 ships stable**, and do the Vitest/Playwright test
rewrite as its own dedicated effort. Until then the integrated jest runner works
and all 111 spec + 3 e2e tests pass on stable Stencil 4.

### Next coverage to add

- Service request shaping in `print.ts` (mock `fetch`, assert URLs/headers/body).
- The `ezp-printer-selection` status-render branches and multi-file outcome logic
  (all-success / all-fail / partial) — high-value, currently only covered
  indirectly.
- `ezp-select` selection + `preSelected` matching.
