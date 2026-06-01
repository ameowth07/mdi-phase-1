# Phase 1 — Window title and naming

## Product meaning (Phase 1)

| UI | Represents |
|----|------------|
| **App bar `<h1>`** | **Place** name (the open place you are editing) |
| **Main tab “Drone Racer”** | Same place’s **root document** (3D workspace) |
| **Isolation tab “Drone”** | An **asset** in that place, not a second place |
| **Explorer breadcrumb** | Often `Drone Racer / …` (`DRONE_WORKSPACE_BREADCRUMB`) |

In the default studio frame, all of these read **Drone Racer** for consistency.

## Implementation (today)

The header is **not** driven by the active document tab or Explorer.

```tsx
// StudioWindowsOS.tsx — app bar
<h1 className={styles.title}>{bunnyAssetWindow ? 'Bunny' : 'Drone Racer'}</h1>

// bunnyAssetWindow = (frameVariant === 'bunny')
```

| Frame | `frameVariant` | Title |
|-------|----------------|-------|
| Main Studio window | `'studio'` (default) | Drone Racer |
| Stacked asset window | `'bunny'` | Bunny |

Main place tab label is separate: `mainDocumentEditorTab === 'droneRacer'` and tab copy “Drone Racer”.

## What does not change the window title

- Switching Client / Server / Script tabs in Test
- Focusing isolation or HoverScript
- Explorer row selection

## Phase 2 intent (not implemented)

- **`h1`** → **Game** name (container for multiple places and assets).
- **Place name** → main-strip place tab(s), breadcrumb, path tooltip — not the window chrome title.

When implementing Phase 2, introduce explicit `game` / `place` (or descriptor) state instead of hardcoding the title string.
