# Phase 2 — Game, places, and tab descriptors

Phase 2 extends the Phase 1 prototype without replacing the frozen baseline in `docs/phase-1/` and tag `phase-1-spec`.

**Branch:** `phase-2`  
**Phase 1 reference:** `docs/phase-1/`, tag `phase-1-spec`

## Goals

1. **Game vs Place** — App bar title = **game**; main strip place tab = **place** document (can differ).
2. **Multiple places** — A game owns many places; each place can have document tabs (viewport, scripts, sim).
3. **Tab descriptor registry** — New tab kinds register via data, not new `switch` branches everywhere.
4. **Phase 1 parity** — Until a milestone explicitly changes UX, run `docs/phase-1/regression-checklist.md`.

## Milestones

| # | Status | Work |
|---|--------|------|
| M0 | Done | Branch `phase-2`, workspace model types, game/place config, header wired to `game.displayName` |
| M1 | Done | Map all Phase 1 tabs → `DocumentTabDescriptor[]` via `tabDescriptorRegistry.ts` (no UI change) |
| M2 | Pending | Second place tab + switch `activePlaceId` |
| M3 | Pending | Render pipeline reads descriptors (stroke, path, content) |
| M4 | Pending | Interaction settings / Reset aware of workspace |
| M5 | Pending | Explorer + breadcrumb: `Game / Place / …` |

See [workspace-model.md](./workspace-model.md) for types and file layout.

## Current behavior (M0)

- Studio frame header shows the **game** display name (`Skyline Drift` placeholder).
- Main place tab label comes from the **place** (`Lobby` for the default studio place).
- **Level 1** is a `dockOnly` place — its document is only in the bottom dock panel, not the main tab strip.
- Bunny asset window: game **Bunny**, place **Bunny** (unchanged feel).

To revert header to Phase 1 copy, set `displayName` in `droneRacerGame` to `'Drone Racer'` in `workspaceConfig.ts`.

## Editing Phase 1 while on Phase 2

Bug fixes that preserve Phase 1 *meaning* can land on `main` and merge into `phase-2`. Update `docs/phase-1/` only when Phase 1 semantics change.
