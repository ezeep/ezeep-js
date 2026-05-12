# Patches

Patches in this directory are applied via [`patch-package`](https://github.com/ds300/patch-package) on `postinstall` (see `package.json` → `scripts.postinstall`).

## Version coupling — read before bumping a patched dependency

`patch-package` matches a patch file to a dependency by **exact version** in its filename
(`<scope>+<name>+<version>.patch`). If you bump the dependency's version without renaming
the patch, `patch-package` will silently skip it — no error, no warning, just the un-patched
upstream code at runtime.

For that reason, every dependency that has a patch in this directory is **pinned to an exact
version** in `package.json` (no `^` or `~`), and any bump must be paired with regenerating
the patch against the new version.

### Currently patched

| Dependency | Pinned version | Patch | Why |
|---|---|---|---|
| `@cortado-holding/colors` | `1.1.12` | `@cortado-holding+colors+1.1.12.patch` | Works around the `sass-embedded` regression that broke `ezp-printing` hydration in cross-origin / dynamic-insertion consumers (issue #94). Without the patch, the build pulls a `sass-embedded` variant that the Rollup ^2.79.2 bump made incompatible with our setup. |

### To bump a patched dependency

1. Update the version in `package.json` (keep it exact, no caret).
2. `npm install` — this applies the OLD patch, which will likely fail to apply cleanly. That's expected.
3. Make the equivalent edits in `node_modules/<dep>/...` against the new version.
4. `npx patch-package <dep>` to regenerate.
5. Delete the old patch file.
6. Commit the new patch alongside the version bump in the same PR.
