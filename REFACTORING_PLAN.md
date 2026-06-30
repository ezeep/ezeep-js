# ezeep-js — Refactoring Plan

> **Status:** In progress — Phases 0–3 substantially landed (see Progress below)
> **Author:** Engineering
> **Date:** 2026-06-30

## Progress (2026-06-30)

Landed and verified (`npm run build` + `npm run lint` + `npm test` all green):

- **Safety net:** Jest wired via `stencil test --spec`; **18 unit tests** covering the
  extracted pure functions ([printer.spec.ts](src/utils/printer.spec.ts),
  [utils.spec.ts](src/utils/utils.spec.ts)). A test immediately caught a latent
  null-tray crash, now fixed. ESLint added ([.eslintrc.json](.eslintrc.json),
  `npm run lint`, **0 problems**). CI now has a **`verify` job** (lint+test+build) gating
  every PR, and publishing is restricted to push-to-main.
- **Phase 1:** [constants.ts](src/shared/constants.ts) (all job/hub status magic numbers),
  [storage.ts](src/shared/storage.ts) (typed wrapper replacing ~31 scattered `localStorage`
  calls), **all 13 `console.*` removed** (0 remain). `.gitignore` fixed (no longer ignores
  the tracked `stencil.config.ts`); confirmed no secrets are git-tracked.
- **Phase 2:** PKCE hardened (spec-compliant 64-byte base64url verifier, safe challenge
  encoding); [http.ts](src/services/http.ts) shared bearer/JSON helper; 401 interceptor now
  single-flight (no refresh storms); token-persistence de-duplicated.
- **Phase 3:** the verbatim-duplicated printer-config→properties mapping and the 3 job-status
  state machines extracted into tested [printer.ts](src/utils/printer.ts)
  (`applyPrinterDefaults`, `classifyJobStatus`); the 9-branch render ternary extracted to
  `renderStatus()`; dead `handleFiles` removed. `ezp-printer-selection` logic 1277 → ~1100 lines.

- **Phase 4 (typing):** API responses typed ([types.d.ts](src/shared/types.d.ts):
  `PrintResponse`, `JobStatusResponse`, `PrepareUploadResponse`); service methods + the
  `authGetJson` generic now return real types; **all `@Event()` emitters typed** (status/dialog
  `<string>`, upload `<File[]>`, stepper `<number>`, etc.). Net effect: the **generated
  `components.d.ts` went from 36 `any` → 2** (consumers now get fully-typed custom events with
  zero runtime change). Source `any` is down to one generic helper plus the deferred
  `preSelected` prop.

Still open: **Phase 2** store/service split · **Phase 4** flip `tsconfig` to `strict` ·
**Phase 5** dependency bumps. Note: `@types/node` 22 was attempted and reverted — it resolves
the `AbortSignal`/`node:stream` issues but surfaces an i18next `t()` → `TFunctionResult` typing
problem, so it must be done **together with an i18next upgrade** (which also unblocks tightening
the `ezp-select` `preSelected` prop from `any`). e2e tests not yet added.

---

> **Hard constraint:** **No public API changes.** Component tags (`ezp-printing`, etc.),
> their props/events/methods, and the published npm surface (`dist/`, `loader/`, Angular
> proxies) must stay 100% backward compatible. The `ngx-ezeep-js` Angular wrapper and any
> existing embedders must keep working without modification.

---

## 1. What this project is

`@ezeep/ezeep-js` is a [Stencil 4](https://stenciljs.com/) web-component library that lets any
web app print through ezeep Blue. The public entry point is the `<ezp-printing>` component,
which orchestrates OAuth (PKCE) auth, file upload to Azure Blob storage, printer/property
selection, and print-job submission + status polling against the ezeep print API.

**Architecture today:**

```
ezp-printing (orchestrator: auth/print/dialog wiring, lifecycle, @Method public API)
 ├─ ezp-auth ............ login dialog
 ├─ ezp-upload .......... file trigger
 ├─ ezp-printer-selection (1277 lines — printer + property UI, upload, print, polling)
 ├─ ezp-dialog / ezp-status / ezp-user-menu / ... (presentational)
 └─ ezp-select / ezp-input / ezp-stepper / ezp-icon* / ezp-label / ezp-text-button (UI primitives)

services/  auth.ts · print.ts · user.ts   (each = a service class + a @stencil/store + free fns)
shared/    types.d.ts · config.json · global.ts · global.scss
utils/     utils.ts (i18n init, polling, form encoding, page-range + paper helpers)
data/      locales/{en,de}.json · options.json · file-types.json
```

## 2. Goals (agreed)

1. **Maintainability** — decompose god-components, remove duplication, strengthen typing/structure.
2. **Safety net** — add tests, ESLint, and stricter TypeScript so future changes are safe.
3. **Modernize deps & build** — update stale dependencies, harden Stencil/CI config.
4. **Fix behavior & security** — weak PKCE verifier, committed secrets, leftover logging,
   inconsistent fetch error handling.

### Non-goals

- No visual redesign or new features.
- No public API/prop/event renames (see hard constraint).
- No framework migration — staying on Stencil.

## 3. Findings (evidence-based)

Measured signals across `src/`:

| Signal | Count / Location | Problem |
| --- | --- | --- |
| Largest component | `ezp-printer-selection.tsx` — **1277 lines** | God component: state + upload + polling + config-mapping + 9-way render ternary. |
| `console.*` in shipped code | **13** | Debug logging left in (e.g. `validateData`, `handlePrint`, `watchFileData`). |
| `any` / `as any` / `<any>` | **44** | Weak typing; defeats the point of TS. |
| Direct `localStorage` access | **31**, scattered | No persistence abstraction; string-literal keys, inconsistent names. |
| Tests | **0** | No Jest spec / e2e anywhere. Refactoring is unguarded. |
| ESLint | **none** | Only Prettier + Stylelint; no static analysis. |
| Duplicated logic | printer-config→properties mapping appears **twice verbatim** (`ezp-printer-selection.tsx:512-561` & `:860-902`) | Same default-derivation logic in `setSelectedProperties` and `connectedCallback`. |
| Duplicated polling | `poll()` util **and** hand-rolled `waitForPrintCompletion()` `while(true)` loop | Two job-status state machines with the **same magic numbers**. |
| Magic numbers | job statuses `0,129,1246,3011,2`; hub errors `412,500,503,1048579` repeated in 3 places | No enum/constants; meaning is implicit. |

**Security / hygiene:**

- `key.pem`, `certificate.pem`, and `.env` are **committed at the repo root** — local dev TLS
  material and env file should not be in version control.
- `.stencil/.build/*.log` (build cache) is committed/tracked — should be ignored.
- **Weak PKCE code verifier** (`auth.ts:30-35`): `btoa(randomValueArray.toString()).substr(0,128)`
  is not a spec-compliant high-entropy verifier and uses deprecated `substr`. The challenge uses
  `String.fromCharCode.apply(null, …)` which can overflow the call stack on large inputs.
- **Fetch interceptor** (`print.ts:33-60`) calls `refreshTokens()` on 401 but does **not** await
  it or retry the original request — a fire-and-forget that races.
- **Inconsistent fetch handling** — most calls do `.then(r => r.json())` with no `response.ok`
  check; `getConfig` returns the raw `Response` while siblings return parsed JSON.

**Build / deps:**

- `stencil.config.ts` reads cert files + `parseInt(process.env.DEV_SERVER_PORT)` at module-eval
  time (comment admits it "needs to be commented out for github actions to work") — fragile;
  should be conditional on env presence.
- Stale deps: `i18next 21.2.4`, `prettier ^2`, `@types/node ^15` (CI runs Node 22),
  `dotenv ^10`. TypeScript is not a direct dependency.
- `tsconfig.json` has no `strict` mode; `target`/`lib` pinned to `es2017`.
- i18n option arrays (`duplexOptions`, `ColorOptions`) are built at class-field init time, before
  `initi18n()` runs — risk of untranslated/stale labels.

## 4. Guiding principles

- **Behavior-preserving.** Every step is a refactor, not a rewrite. Public DOM/JS contract frozen.
- **Safety net first.** No structural change to risky code (`ezp-printer-selection`, `auth`,
  polling) until characterization tests pin current behavior.
- **Small, reviewable PRs.** Each phase below is independently shippable and revertible.
- **Boy-scout, not big-bang.** Land infrastructure, then refactor module by module.

## 5. Phased plan

### Phase 0 — Safety net & guardrails *(do first; unblocks everything)*

Goal: be able to change code with confidence and catch regressions automatically.

- [ ] Enable Stencil's built-in **Jest** unit testing + **Puppeteer** e2e (`stencil test`).
- [ ] Add **ESLint** (`@stencil-community/eslint-plugin`, `@typescript-eslint`) wired to the same
      Prettier config; add `npm run lint`.
- [ ] Write **characterization tests** (spec + e2e) for the highest-risk, hardest-to-change paths,
      capturing *current* behavior exactly:
  - PKCE: verifier/challenge generation, auth-URI build.
  - Print status polling: each job-status → UI-state transition (success/processing/failed/hub).
  - Multi-file upload orchestration: all-success / all-fail / partial-success outcomes.
  - `checkAuth` / token-refresh / localStorage persistence round-trips.
- [ ] Add a **CI `test` + `lint` job** (PRs, not just `push` to `main`) so regressions block merge.
- [ ] Add `.gitignore` entries and **remove tracked secrets/build cache**: `key.pem`,
      `certificate.pem`, `.env`, `.stencil/`. Rotate the committed dev certs.

> Acceptance: `npm run lint` and `npm test` pass in CI; coverage exists for auth + print flows.

### Phase 1 — Foundational cleanup *(low risk, high signal)*

- [ ] Introduce a typed **constants module** for status codes:
      `JobStatus` (Success=0, Processing=[129,1246], Failed=[2,3011]) and
      `HubDriverError = [412,500,503,1048579]`. Replace all magic numbers.
- [ ] Remove the **13 `console.*`** calls (or route through a `debug` flag that defaults off).
- [ ] Add a thin **`storage` helper** with typed keys (`refreshToken`, `accessToken`,
      `isAuthorized`, `properties`, `printer`) — replace the 31 scattered `localStorage` calls.
- [ ] Fix lint-surfaced typos/naming without touching the public API
      (`printPorperties` param, `ColorOptions` casing — internal only).

> Acceptance: zero magic status numbers, zero stray `console.*`, single storage entry point.

### Phase 2 — Service layer hardening

- [ ] Centralize fetch: one `request()` wrapper that sets auth headers, checks `response.ok`,
      and parses JSON consistently (kills the `getConfig`-returns-Response inconsistency).
- [ ] Fix the **fetch interceptor**: `await` the refresh and **retry the original request** once,
      or document why fire-and-forget is acceptable; avoid the current race.
- [ ] Harden **PKCE** in `auth.ts`: spec-compliant high-entropy verifier
      (base64url of `crypto.getRandomValues`), drop deprecated `substr`, replace
      `String.fromCharCode.apply` with a safe loop/`reduce`. **Covered by Phase 0 tests.**
- [ ] De-duplicate token-persistence logic shared by `getAccessToken` / `refreshTokens`.
- [ ] Separate each service's **store** from its **service class** (own files) so data and
      behavior stop being co-located in one module.

> Acceptance: one fetch path, hardened auth, interceptor retries — all green against Phase 0 tests.

### Phase 3 — Decompose `ezp-printer-selection` (the big one)

Target: shrink the 1277-line component to a thin view that delegates. **No tag/prop/event change.**

- [ ] Extract a framework-agnostic **`printJob` orchestrator** (upload → print → poll) out of the
      component. Collapse the two polling implementations (`poll()` util + `waitForPrintCompletion`)
      into one state machine.
- [ ] Extract the **printer-config → `selectedProperties` mapping** (currently duplicated at
      `:512-561` and `:860-902`) into a single pure function with unit tests.
- [ ] Extract the **9-branch status render ternary** into a `renderStatus()` helper / lookup table.
- [ ] Extract **multi-file processing** (`processSingleFile` / `processMultipleFiles` /
      `handleFiles`) into the orchestrator; the component only reflects progress state.
- [ ] Keep all `@Prop`/`@Event`/`@Listen` signatures identical; only the internals move.

> Acceptance: component < ~400 lines, mapping/polling unit-tested, e2e flows unchanged.

### Phase 4 — Typing & shared model

- [ ] Drive down the **44 `any`s** — type API responses (print, config, status, user), event
      `detail` payloads, and the `poll`/utils generics.
- [ ] Flip `tsconfig` to **`strict: true`** incrementally (start with `strictNullChecks`),
      fixing fallout module by module.

> Acceptance: `strict` on, `any` count near zero, no `tsc` errors.

### Phase 5 — Dependency & build modernization

- [ ] Bump **TypeScript** (add as direct devDep), **Prettier 3**, **`@types/node` 22** (match CI),
      **dotenv** current, and evaluate **i18next** upgrade (verify init API + `nsSeparator` usage).
- [ ] Make `stencil.config.ts` **env-safe**: only load `devServer` HTTPS when cert env vars exist,
      so the CI/no-cert path needs no manual commenting-out.
- [ ] Re-run the full Phase 0 test suite + a manual smoke of all 8 `samples/` against the build.

> Acceptance: clean `npm ci && npm run build`, no manual config edits for CI, samples still print.

## 6. Sequencing & risk

```
Phase 0 (safety) ─┬─> Phase 1 (cleanup) ──> Phase 2 (services) ──> Phase 3 (decompose) ──> Phase 4 (types) ──> Phase 5 (deps)
                  └─ Phases 1, 4, 5 are largely independent and can interleave once 0 lands.
```

- **Highest risk:** Phase 3 (the god-component) and Phase 2 (auth). Both are explicitly gated
  behind Phase 0 characterization tests.
- **Validation each phase:** `npm run lint` + `npm test` + `npm run build` + manual run of the
  relevant `samples/*.html` (button, custom, file, iframe, pre-auth triggers).
- **Rollback:** every phase is its own PR; revert is a single `git revert`.

## 7. Out of scope / follow-ups

- Visual/UX changes, new printer features, SSR.
- Public API redesign (would require coordinating a `ngx-ezeep-js` major + consumer migration).
- Replacing `@stencil/store` with another state lib.

## 8. Open questions

1. Target browser matrix — can we drop `buildEs5: 'prod'` / raise the TS target? (affects bundle size)
2. Is there an existing ezeep test/staging tenant we can point e2e auth flows at?
3. Preferred coverage gate for CI (e.g. fail under X%)?

---

### Suggested first PR

**Phase 0, slice 1:** add ESLint + Jest config, a `.gitignore` cleanup removing the committed
secrets/build cache, and characterization tests for `auth.ts` (PKCE) and the print-status polling
state machine. Small, no behavior change, and it unlocks every later phase.
