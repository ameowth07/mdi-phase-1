# Phase 1 — Regression checklist

Run against `phase-1-spec` tag or `main` when verifying Phase 1 behavior. Compare to [document-tabs.md](./document-tabs.md).

## Startup & reset

- [ ] App loads without console errors (hard refresh)
- [ ] **Prototype Reset** restores Interaction settings from `PROTOTYPE_SETTINGS_DEFAULTS`
- [ ] Asset Manager thumbnails load (local `public/assets/`, not broken Figma URLs)

## Window & place

- [ ] Main window title is **Drone Racer**
- [ ] **Open asset window** spawns second frame titled **Bunny**
- [ ] Title does not change when switching tabs in the main workspace

## Main strip — Edit

- [ ] **Drone Racer** tab shows main viewport; stroke when main column focused (Tab stroke on)
- [ ] **Script** tabs open script content; path tooltip `Drone Racer/Script`
- [ ] With **Show asset in isolation**, main + iso strips visible

## Main strip — Test (Play)

- [ ] **Play** enters Test; **Stop** returns to Edit without crash
- [ ] **Client** / **Server** tabs appear; correct sim viewport art
- [ ] Tab stroke connected: no infinite loop / blank screen
- [ ] Connected gutters on **both** main and isolation tab rows when iso tab selected
- [ ] Stop then Play restores last Test strip state (tabs/focus)

## Isolation strip

- [ ] **Drone** / **HoverScript** switch isolation content
- [ ] Tab stroke only when isolation column focused (`isoStripTabStrokeActive`)
- [ ] Connected mode: no dark band protruding into panel under active tab

## Explorer selection

- [ ] Edit: select e.g. **Billboard** in Drone Racer tree
- [ ] Enter Test, exit Test — **Billboard** still selected in edit hierarchy
- [ ] Switching to isolation tree uses isolation selection context (not edit row)

## Tab stroke modes

- [ ] Top edge: stroke on border (not inset) for drone/client/server
- [ ] All edges: left/right on border + bottom outside
- [ ] Connected: active tab meets panel; side strokes on tab edge centerline

## Optional quick URLs

- Local: `npm run dev` → http://localhost:5173/
- Pages: https://ameowth07.github.io/mdi-phase-1/
