# Phase 1 — Frozen prototype spec

Phase 1 is the **MDI / Studio Windows OS interaction prototype**: document tabs, focus strokes, connected tabs, play vs edit, asset isolation, and Explorer selection behavior.

This folder is the **written baseline**. The running app on the tagged commit is the **behavioral baseline**.

## Baseline

| Item | Value |
|------|--------|
| Git tag | `phase-1-spec` |
| Live demo | https://ameowth07.github.io/mdi-phase-1/ |
| Reset defaults | `src/components/StudioWindowsOS/prototypeDefaults.ts` |

## Docs

- [document-tabs.md](./document-tabs.md) — tab strips, IDs, datamodel chrome, content
- [window-and-naming.md](./window-and-naming.md) — app bar title vs tabs (Place in Phase 1)
- [regression-checklist.md](./regression-checklist.md) — manual checks before changing behavior

## Updating the freeze

Phase 1 can still be **edited** (bug fixes, polish). When behavior meaningfully changes:

1. Update the relevant doc in this folder.
2. Note the change in your commit message.
3. Move or add a new tag (e.g. `phase-1-spec` on the new commit) if this remains the canonical baseline.

Phase 2 work should branch from `main` and document deltas in `docs/phase-2/` rather than overwriting Phase 1 meaning silently.

## Phase 2 direction (summary)

- **Header (`h1`)** → Game name (multiple places).
- **Main strip tabs** → Place documents (and existing script/sim types).
- **Isolation strip** → Assets within a place/game.
- Implementation: tab **descriptor registry**; see parent README in repo or planning notes when `docs/phase-2/` exists.
