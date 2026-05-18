# Theme color operators

The Theme settings panel drives four global CSS variables on `:root`. Tokens on `.frame` (and a few Asset Manager locals) consume those variables via `calc()` in HSL / HSLA definitions.

**Source files**

- Slider UI: `src/components/StudioWindowsOS/InteractionSettingsPanel.tsx`
- Binding: `src/components/StudioWindowsOS/themeColorOperators.ts`
- Defaults: `src/index.css`
- Token definitions: `src/components/StudioWindowsOS/StudioWindowsOS.module.css`
- Asset Manager extras: `src/components/StudioWindowsOS/AssetManagerPanel.module.css`

---

## Global operators (sliders → `:root`)

| Slider | CSS variable | Range | Default | Readout |
|--------|----------------|-------|---------|---------|
| Hue | `--delta-hue` | −180 … +180 (deg) | `0` | `0°`, `+45°`, etc. |
| Saturation | `--sat-multiplier` | 0 … 2 | `1` | `1x`, `1.5x`, etc. |
| Lightness | `--lightness-offset` | −10% … +10% | `0%` | `0%`, `+5%`, etc. |
| Contrast | `--contrast-scale` | 0.5 … 1.5 | `1` | `1x`, `1.2x`, etc. |

Sliders write to `document.documentElement` on `input`. Reset restores the defaults above.

---

## Token formula pattern

Each themed color has fixed base components **H₀**, **S₀**, **L₀** (and optional alpha **A**). Sliders apply uniformly:

### Hue

```
H = H₀ + var(--delta-hue)
```

### Saturation

```
S = S₀ × var(--sat-multiplier)
```

### Lightness + contrast

Two contrast modes split **surfaces** from **text / strokes / shifts**:

**Surfaces** — darker when contrast increases:

```
L = (L₀ + var(--lightness-offset)) × (2 - var(--contrast-scale))
```

**Text, strokes, shifts** — lighter when contrast increases:

```
L = (L₀ + var(--lightness-offset)) × var(--contrast-scale)
```

At `--contrast-scale: 1`, both multipliers are `1` (neutral).

| Contrast scale | Text / stroke L | Surface L |
|----------------|-----------------|-----------|
| 1.5 (higher) | × 1.5 (lighter) | × 0.5 (darker) |
| 1.0 (default) | × 1.0 | × 1.0 |
| 0.5 (lower) | × 0.5 (darker) | × 1.5 (lighter) |

### CSS shape

**Opaque (HSL):**

```css
hsl(
  calc(H₀ + var(--delta-hue)),
  calc(S₀ * var(--sat-multiplier)),
  calc((L₀ + var(--lightness-offset)) * <contrast-multiplier>)
)
```

**Translucent (HSLA):** same H/S/L; alpha is fixed per token.

`<contrast-multiplier>` is either `var(--contrast-scale)` or `(2 - var(--contrast-scale))`.

---

## Tokens on `.frame`

Defined in `StudioWindowsOS.module.css`.

| Token | H₀ | S₀ | L₀ | Contrast | Alpha |
|-------|----|----|-----|----------|-------|
| `--surface-0` | 240 | 8% | 8% | surface | — |
| `--surface-100` | 230 | 11% | 11% | surface | — |
| `--content-default` | 225 | 11% | 85% | text | — |
| `--content-muted` | 230 | 10% | 76% | text | — |
| `--content-emphasis` | 240 | 7% | 97% | text | — |
| `--panel-chrome-title` | 230 | 10% | 76% | text | — |
| `--stroke-default` | 227 | 84% | 90% | text | 0.12 |
| `--stroke-muted` | 227 | 84% | 90% | text | 0.08 |
| `--shift-200` | 227 | 84% | 90% | text | 0.08 |
| `--shift-300` | 227 | 84% | 90% | text | 0.12 |
| `--shift-400` | 227 | 84% | 90% | text | 0.16 |
| `--overmedia-100` | 230 | 11% | 11% | surface | 0.92 |
| `--beta-stroke` | 227 | 84% | 90% | text | 0.4 |
| `--edit-workspace-focus-ring` | 0 | 0% | 100% | text | 0.5 |

### Example: `--content-muted` (inactive tab labels)

```css
--content-muted: hsl(
  calc(230 + var(--delta-hue)),
  calc(10% * var(--sat-multiplier)),
  calc((76% + var(--lightness-offset)) * var(--contrast-scale))
);
```

At defaults: `hsl(230, 10%, 76%)` (~`#bcbec8`).

---

## Asset Manager tokens

Defined on `.root` in `AssetManagerPanel.module.css`; still inherit `--delta-hue`, etc. from `.frame`.

| Token | H₀ | S₀ | L₀ | Contrast | Alpha |
|-------|----|----|-----|----------|-------|
| `--am-tree-selection` | 229 | 23% | 18% | surface | — |
| `--am-toolbar-divider` | 0 | 0% | 94% | text | 0.1 |

---

## UI mappings (examples)

| UI element | Token |
|------------|--------|
| Inactive tab label | `--content-muted` |
| Active tab label | `--content-default` |
| Asset Manager search field background | `--shift-200` |
| Ribbon active tab background | `--shift-300` |
| Ribbon mezzanine | `--overmedia-100` |
| Workspace gutters | `--surface-0` |

---

## Not controlled by sliders

These remain fixed hex/rgba/brand colors and do not use the operator formulas:

- App shell `body` background (`#0a0a0b`)
- Script editors (`#0d0e12`, `#e4e6ed`)
- Client/Server/sim focus rings and tints (blue/green)
- Explorer tree icon colors (inline in TSX)
- Light tooltips and inverted chips (`#fff` / `#202227`)
- Properties material swatches and RGB axis colors
- Many `rgba(208, 217, 251, …)` hovers not yet mapped to `--shift-*` / `--stroke-*`

See codebase search for `#` / `rgba(` outside `var(--…)` token usage.
