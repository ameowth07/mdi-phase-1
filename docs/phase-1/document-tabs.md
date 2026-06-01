# Phase 1 — Document tabs

All document tabs are `TabWithPathTooltip` with `role="tab"`. Chrome (stroke, connected, tint) comes from `buildTabClass()` in `StudioWindowsOS.tsx` and Interaction settings.

## Tab strips

| Strip | DOM / CSS | Column focus |
|-------|-----------|----------------|
| **Main** | `editTabStripMain` → `.tabRow` | `editDocumentFocus === 'main'` for tab stroke on main strip |
| **Isolation** | `editTabStripIso` → `.tabRow.assetIsolationTabRow` | `editDocumentFocus === 'isolation' \| 'hoverScript'` |
| **Combined row** | `editCombinedTabStrip` holds main + iso side by side | Per-column rules above |

Floating document window repeats the isolation strip + panel when undocked.

## Main strip tabs

| Label | Internal ID | Type | Active when | Datamodel stroke | Path tooltip | Content |
|-------|-------------|------|-------------|------------------|--------------|---------|
| Drone Racer | `droneRacer` | `MainDocumentEditorTab` | `mainDocumentEditorTab === 'droneRacer'` | `drone` (edit); follows `simViewportFocus` in Test | `Drone Racer/Drone Racer` | Main viewport (`viewport.png` / sim art) |
| Script (×2) | `scriptA`, `scriptB` | `MainDocumentEditorTab` | Tab selected | `drone` | `Drone Racer/Script` | Script placeholder / editor |
| Client Script | `clientScript` | `MainDocumentEditorTab` | Tab selected | `client` (cyan) | Client script path | Client script body |
| Server Script | `serverScript` | `MainDocumentEditorTab` | Tab selected | `server` (green) | Server script path | Server script body |
| Client | `client` | `SimDocumentStripTab` | Test only; `simFocusedStripTab` / client active | `client` | `Drone Racer (Client)` | Client sim viewport |
| Server | `server` | `SimDocumentStripTab` | Test only; server active | `server` | `Drone Racer (Server)` | Server sim viewport |
| Client N | `client-1`, … | `SimDocumentStripTab` | Multi-client Test mode | `client` | Per-instance label | Client sim |

Selecting Client/Server sim tabs keeps `mainDocumentEditorTab` as `droneRacer` and updates `simViewportFocus` / `simFocusedStripTab`.

## Isolation strip tabs

| Label | Internal ID | Type | Active when | Datamodel stroke | Path tooltip | Content |
|-------|-------------|------|-------------|------------------|--------------|---------|
| Drone | `isolation` | `EditIsolationTabId` | `editDocumentFocus === 'isolation'` | `drone` | `Drone/Drone` | Asset isolation preview images |
| HoverScript | `hoverScript` | `EditIsolationTabId` | `editDocumentFocus === 'hoverScript'` | `drone` | `Drone/HoverScript` | HoverScript editor |

## Focus & column model

- **`editDocumentFocus`**: `'main' | 'isolation' | 'hoverScript'` — which document **column** owns focus (inset rings, iso tab stroke).
- **`mainDocumentEditorTab`**: which **document** is open in the main column (place, script, etc.).
- **Test (Play)**: `clientSimActive` adds sim tabs and Client/Server viewports; session restored on Stop via `playModeSessionRef`.

## Tab stroke settings (Interaction panel)

Requires **Tab stroke top edge** for stroke chrome.

| Setting | Behavior |
|---------|----------|
| Tab stroke top edge | Top border-edge stroke; bottom outside shadow (non-connected) |
| Tab stroke all edges | Top/left/right on border; bottom outside |
| Tab stroke connected | Top/left/right on border; open bottom; gutter `::after` on tab row; panel ring 3-sided |
| Tab tint | Fill on Client/Server tabs when enabled |

Connected gutter metrics: `useConnectedTabGutterMetrics` — one row per `.tabRow` with a selected tab; isolation panel gets `--tab-connected-stroke-color`.

## Explorer selection (Phase 1 rule)

Selections are **persisted per Explorer tree context** in `persistedExplorerSelectionRef` (not re-randomized when entering/leaving Test). Prototype **Reset** clears persisted selections and re-seeds.

Contexts: `droneRacerEdit`, `droneIsolation`, `bunny`, `flatSim`, `simHierarchyClient` / `simHierarchyServer`.

## Bunny asset window

Second frame from **Open asset window**: `frameVariant="bunny"`. Title **Bunny**; simplified workspace (no isolation column / script tabs per bunny mode).
