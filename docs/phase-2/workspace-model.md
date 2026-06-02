# Phase 2 — Workspace model

Code lives under `src/components/StudioWindowsOS/workspaceModel/`.

## Types

### `Game`

Container shown in the **window title** (`<h1>`).

- `id`, `displayName`
- `places[]`, `defaultPlaceId`

### `Place`

One editable place (Roblox Place analogue).

- `id`, `displayName`
- `rootTabId` — links to existing `MainDocumentEditorTab` id for the root viewport tab (`droneRacer` today)

### `DocumentTabDescriptor` (M1+)

Unified description of a document tab for the registry:

- `strip`: `'main' | 'isolation' | 'floating'`
- `kind`: place-root, place-script, sim-client, isolated-asset, …
- `datamodel`, `pathTooltip`, `content`, optional `placeId`

Phase 1 tab unions (`MainDocumentEditorTab`, `SimDocumentStripTab`, `EditIsolationTabId`) remain until migration completes; descriptors wrap them via `legacyKey`.

### Tab registry (M1)

`tabDescriptorRegistry.ts` exports `buildPhase1TabDescriptorCatalog({ place, … })` — full catalog for main, isolation, and sim strips, plus `descriptorForMainTab` / `descriptorForSimTab` / `descriptorForIsolationTab` lookups. Render code still uses legacy switches until M3.

## Config

`workspaceConfig.ts` exports:

- `droneRacerGame` — default studio workspace
- `bunnyGame` — asset popup frame
- `resolveWorkspace(frameVariant)` — picks game + default place for a frame

## Wiring

`StudioWindowsOS` calls `resolveWorkspace(frameVariant)` and uses:

- `game.displayName` → app bar title
- `defaultPlace.displayName` → main place tab label (M0; more places in M2)

`DroneRacerWorkspace` still uses existing tab state; place switching will use `activePlaceId` in a later milestone.
