/**
 * URL for files served from `public/` (honors Vite `base`, e.g. `/phase-1-mdi-sim/` on GitHub Pages).
 */
export function publicAssetUrl(path: string): string {
  const normalized = path.replace(/^\//, '')
  const base = import.meta.env.BASE_URL
  return base.endsWith('/') ? `${base}${normalized}` : `${base}/${normalized}`
}
