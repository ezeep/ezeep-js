# Dependency status

Last reviewed: 2026-06-30. After this pass: **`npm audit` → 0 vulnerabilities**
(runtime and dev), and `build` + `lint` + 40 spec + 2 e2e tests all pass.

## Upgraded

| Package | From → To | Why / risk |
| --- | --- | --- |
| `@stencil/core` | 4.43.4 → 4.43.5 | Patch. Core framework. |
| `@azure/storage-blob` | 12.31 → 12.33 | Minor, **runtime** (file upload). |
| `@stencil/angular-output-target` | 1.3.1 → 1.4.0 | Minor. Angular proxy generation. |
| `@types/css-font-loading-module` | 0.0.6 → 0.0.14 | Types only. |
| `eslint` | 8 → 9 (+ flat config) | Removed transitive vulns; modernised to `eslint.config.mjs`. |
| `typescript-eslint` | 6 → 8 | Required for ESLint 9; replaces the split parser/plugin packages. |
| `dotenv` | 10 → 17 | Dev-only (`stencil.config.ts`); stable `dotenv/config` API. |
| `i18next` | 21 → 26 | **Runtime.** Done under a new `i18n.spec.ts` safety net (init, translation, language switch, dotted keys — identical behaviour). `t()` now returns `string`, which cleared the old typing blocker. |
| `@types/node` | 15 → 22 | Unblocked by the i18next bump; also let us drop the `AbortSignal` workaround in `print.ts` and tighten `ezp-select`'s `preSelected` to `string \| number \| null` (generated `components.d.ts` is now 0 `any`). |
| _lockfile_ | `npm audit fix` | Bumped transitive `js-yaml`/`tmp` to non-vulnerable versions. |

## Deliberately NOT upgraded (and why)

These were skipped on purpose — each is either runtime-risky or needs a dedicated,
separately-tested effort. **None of them leaves a security vulnerability** (audit is
clean).

| Package | Available | Reason held back |
| --- | --- | --- |
| `@types/node` | 22 → 26 | Now on 22 (see above); 26 offers no runtime benefit and 22 matches the CI Node line closely enough. |
| `@cortado-holding/colors` | 1.1.12 → 2.0.5 | **Major + locally patched** ([patches/](patches/) is pinned to 1.1.12). A major bump breaks the patch; needs the patch re-evaluated against 2.x. |
| `jest` / `jest-cli` / `@types/jest` | 29 → 30 | Stencil 4's integrated test runner **requires jest 29** (it errors asking for `jest@29`). Moves with the `@stencil/vitest` migration (Stencil v5). |
| `puppeteer` | 23 → 25 | E2E browser; 23 is proven. Moves with the `@stencil/playwright` migration. |
| `prettier` | 2 → 3 | Low risk but would **reformat the whole codebase** (huge noise diff). Do as a dedicated "reformat" commit if wanted. |
| `eslint` | 9 → 10 | `typescript-eslint` 8 doesn't yet officially support ESLint 10; staying on the well-supported 9. |
| `stylelint` (+ `-config-prettier`/`-order`/`-prettier`) | 16 → 17 | Current config relies on `stylelint-config-prettier`, which is deprecated/removed in newer stylelint; needs a config rework. Dev-only (SCSS). |
| `@rollup/plugin-replace` | 3 → 6 | Build-time `<% %>` replacement works at 3; a major bump risks changing replace behaviour for no clear gain. |

## Recommended next dependency work

The largest runtime modernisation (i18next + `@types/node`) is now done. Remaining,
in rough priority:

- **`strictNullChecks`** (tsconfig) — not a dependency, but the natural next
  hardening step (~27 null-guards; `noImplicitAny`/`noImplicitThis`/`alwaysStrict`
  are already on).
- **`@cortado-holding/colors` 2.x** — re-evaluate the local patch, then bump.
- **Stencil v5 + `@stencil/vitest`/`@stencil/playwright`** — the test-runner is
  deprecated; this also lets `jest`/`puppeteer` move forward (see [TESTING.md](TESTING.md)).
- **`prettier` 3** / **`stylelint` 17** — dev formatting; do as isolated commits.
