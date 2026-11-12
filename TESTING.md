# Testing

This project uses Stencil's built-in test runner (Jest for unit/spec tests,
Puppeteer for e2e). Tests live next to the code they cover.

## Running tests

| Command                 | What it runs                                                                  |
| ----------------------- | ----------------------------------------------------------------------------- |
| `npm test`              | Unit + component **spec** tests (`*.spec.ts`/`*.spec.tsx`). Fast, no browser. |
| `npm run test.watch`    | Spec tests in watch mode.                                                     |
| `npm run test.coverage` | Spec tests with a coverage report.                                            |
| `npm run test.e2e`      | **E2E** tests (`*.e2e.ts`) in headless Chromium via Puppeteer.                |
| `npm run test.all`      | Spec + e2e together.                                                          |

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

**E2E tests (145):** real headless Chromium, real components/services/stores,
faked network (see [E2E harness](#e2e-harness)).

- [ezp-printing.e2e.ts](src/components/ezp-printing/ezp-printing.e2e.ts) — the
  component as a host app sees it: triggers (`button`/`file`/`custom`),
  language (attribute, runtime switch, account language), theme/appearance,
  API host attributes, session restore + reload, the public methods
  (`open`, `logOut`, `checkAuth`, `getAuthUri`, `getSasUri`,
  `setAuthRefreshToken`), `filedata`, the OAuth redirect-page role, and
  `printFinished`.
- [ezp-auth.e2e.ts](src/components/ezp-auth/ezp-auth.e2e.ts) — sign-in: the
  authorize URL and PKCE challenge, code → token exchange (verifier matches the
  challenge), rejection of codes from a wrong origin or window, token storage
  (refresh token persisted, access token never), `hidelogin`, blocked popups
  and retry, the `code` attribute.
- [ezp-upload.e2e.ts](src/components/ezp-upload/ezp-upload.e2e.ts) — the upload
  card: native file picker, list/add/remove/clear, drag and drop.
- [ezp-printer-selection.e2e.ts](src/components/ezp-printer-selection/ezp-printer-selection.e2e.ts)
  — the print options and the print itself: printer preselection and remembered
  settings, capability-driven options, the exact `Print` request body, upload →
  print → status polling, multi-file / partial / failed / retried / cancelled
  jobs, pull-print queues, print-by-URL (incl. the expired-file reprint), and
  leaving the card.
- [ezp-user-menu.e2e.ts](src/components/ezp-user-menu/ezp-user-menu.e2e.ts) —
  account links, theme and appearance switching, logout (token revoked, session
  cleared, printer settings kept).
- [ezp-select](src/components/ezp-select/ezp-select.e2e.ts),
  [ezp-stepper](src/components/ezp-stepper/ezp-stepper.e2e.ts),
  [ezp-dialog](src/components/ezp-dialog/ezp-dialog.e2e.ts),
  [ezp-input](src/components/ezp-input/ezp-input.e2e.ts),
  [ezp-status](src/components/ezp-status/ezp-status.e2e.ts) — each control on
  its own with real mouse/keyboard input: keyboard navigation, focus trap,
  key filtering, debounce, ARIA state.

## E2E harness

[src/testing/mock-backend.ts](src/testing/mock-backend.ts) is shared by the
journey tests. `openPrinting(options)` opens a page with one `<ezp-printing>`
and, before any component code runs, replaces `window.fetch` with an in-page
fake of the three backends (account/OAuth API, print API, blob storage). Nothing
leaves the machine, and every request is recorded:

```ts
const page = await openPrinting({ signedIn: true, printers: [PRINTERS[0]] })
await goToPrintOptions(page, 'report.pdf')
await click(page, 'ezp-printing >>> ezp-printer-selection >>> #print')
await waitForInstance(page, 'ezp-status', 'print-success')

const [print] = await getCalls(page, 'Print')
expect(jsonBody(print).printerid).toBe('printer-1')
```

- **Shaping the backend** — options set the printers, their capabilities, the
  supported file types, the user, queued `Print`/`Status` answers
  (`printResponses`, `statusResponses`), routes that fail at network level
  (`failing`) and seeded storage. `updateBackend` changes them mid-test.
- **Sign-in** — `window.open` returns a hidden same-page window (or `null` with
  `popup: 'blocked'`); `postAuthCode` then delivers the code as the popup would.
  The fake token endpoint only accepts `VALID_CODE` and refresh tokens it issued.
- **Selectors** — puppeteer's `>>>` pierces shadow roots
  (`ezp-printing >>> ezp-upload >>> #continue`). Status cards and dialogs are
  identified by their `instance` _property_, so use `waitForInstance` /
  `currentStatus` rather than an attribute selector. Read labels with `textOf`
  and file lists with `fileNames`.

Things the harness does for you, and why:

- `localStorage` is redirected to `sessionStorage`. Test files run in parallel as
  tabs of one browser on one origin, so real `localStorage` would be shared
  between tests running at the same time.
- `click` centres its target first: the print options have a sticky footer that
  covers controls at the bottom of the scroll area.
- `waitFor` polls `page.$$` instead of `page.waitForSelector`, which does not
  find elements below a shadow root that also contains a `<slot>`.

## Conventions

- **Pure logic** (anything in `utils/`, `shared/`, services) → plain spec tests.
  Prefer testing extracted pure functions over reaching into components.
- **Component rendering / state** → `newSpecPage` spec tests (jsdom, fast).
- **Real-browser behaviour** (clicks, focus, shadow DOM, layout) → `*.e2e.ts`
  with `newE2EPage`.
- **User journeys** (anything that signs in, loads printers or prints) →
  `*.e2e.ts` with `openPrinting` from the [E2E harness](#e2e-harness). Never let
  an e2e test reach a real backend.
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

**Status (2026-07): deliberately deferred.** Investigated and it is _not_ a
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
and all spec + e2e tests pass on stable Stencil 4.

### Next coverage to add

- Service request shaping in `print.ts` (mock `fetch`, assert URLs/headers/body).
- The `ezp-printer-selection` status-render branches and multi-file outcome logic
  (all-success / all-fail / partial) — high-value, currently only covered
  indirectly.
- `ezp-select` selection + `preSelected` matching.
