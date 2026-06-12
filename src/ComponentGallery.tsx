import { useCallback, useState, type ReactNode } from 'react'
import StudioWindowsOS from './components/StudioWindowsOS/StudioWindowsOS'
import { LegacyRibbon, RibbonToolbar } from '@mdi/legacy-ribbon'
import PropertiesPanel from './components/StudioWindowsOS/PropertiesPanel'
import InteractionSettingsPanel from './components/StudioWindowsOS/InteractionSettingsPanel'
import AssetManagerPanel from './components/StudioWindowsOS/AssetManagerPanel'
import OutputPanel, { type OutputLogEntry } from './components/StudioWindowsOS/OutputPanel'
import ClientSim from './components/StudioWindowsOS/ClientSim'
import ServerSim from './components/StudioWindowsOS/ServerSim'
import { PROTOTYPE_SETTINGS_DEFAULTS } from './components/StudioWindowsOS/prototypeDefaults'
import styles from './ComponentGallery.module.css'

type RegionId =
  | 'appbar'
  | 'ribbon'
  | 'ribbon-toolbar'
  | 'workspace'
  | 'explorer'
  | 'properties'
  | 'prototype'
  | 'dock-output'
  | 'dock-assets'
  | 'command'
  | 'footer'
  | 'viewport-client'
  | 'viewport-server'

const SAMPLE_OUTPUT: OutputLogEntry[] = [
  {
    id: '1',
    timestamp: '23:31:31.708',
    message: 'Plugin has already been configured',
    variant: 'default',
  },
  {
    id: '2',
    timestamp: '23:32:04.112',
    message: 'Error: Exception... - Line 4: CameraZoomScript',
    variant: 'error',
  },
]

function GalleryInteractionSettings() {
  const d = PROTOTYPE_SETTINGS_DEFAULTS
  const [hasStroke, setHasStroke] = useState<boolean>(d.playModeHasStroke)
  const [hasFocusStroke, setHasFocusStroke] = useState<boolean>(d.playModeHasFocusStroke)
  const [tabStroke, setTabStroke] = useState<boolean>(d.playModeTabStroke)
  const [tabStrokeAllEdges, setTabStrokeAllEdges] = useState<boolean>(d.playModeTabStrokeAllEdges)
  const [tabStrokeConnected, setTabStrokeConnected] = useState<boolean>(d.playModeTabStrokeConnected)
  const [explorerNoBadge, setExplorerNoBadge] = useState<boolean>(d.explorerNoBadge)
  const [explorerFocusBadge, setExplorerFocusBadge] = useState<boolean>(d.explorerFocusBadge)
  const [explorerBadgeShowIndicator, setExplorerBadgeShowIndicator] = useState<boolean>(
    d.explorerBadgeShowIndicator,
  )
  const [explorerOriginalDmBadge, setExplorerOriginalDmBadge] = useState<boolean>(
    d.explorerOriginalDmBadge,
  )
  const [explorerShowBreadcrumb, setExplorerShowBreadcrumb] = useState<boolean>(
    d.explorerShowBreadcrumb,
  )
  const [fullTint, setFullTint] = useState<boolean>(d.playModeFullTint)
  const [selectionTint, setSelectionTint] = useState<boolean>(d.playModeSelectionTint)
  const [footerTint, setFooterTint] = useState<boolean>(d.playModeFooterTint)
  const [tabTint, setTabTint] = useState<boolean>(d.playModeTabTint)
  const [splitView, setSplitView] = useState<boolean>(d.playModeSplitView)
  const [toggleOpensDmIfClosed, setToggleOpensDmIfClosed] = useState<boolean>(
    d.toggleOpensDmIfClosed,
  )
  const [showAssetInIsolation, setShowAssetInIsolation] = useState<boolean>(d.showAssetInIsolation)
  const [editDatamodelShowStroke, setEditDatamodelShowStroke] = useState<boolean>(
    d.editDatamodelShowStroke,
  )
  const [hideAssetTinting, setHideAssetTinting] = useState<boolean>(d.hideAssetTinting)
  const [panelTitlesLeftAligned, setPanelTitlesLeftAligned] = useState<boolean>(
    d.panelTitlesLeftAligned,
  )
  const [showFullBreadcrumbWhenDetached, setShowFullBreadcrumbWhenDetached] = useState<boolean>(
    d.showFullBreadcrumbWhenDetached,
  )

  return (
    <InteractionSettingsPanel
      hasStroke={hasStroke}
      onHasStrokeChange={setHasStroke}
      hasFocusStroke={hasFocusStroke}
      onHasFocusStrokeChange={setHasFocusStroke}
      tabStroke={tabStroke}
      onTabStrokeChange={setTabStroke}
      tabStrokeAllEdges={tabStrokeAllEdges}
      onTabStrokeAllEdgesChange={setTabStrokeAllEdges}
      tabStrokeConnected={tabStrokeConnected}
      onTabStrokeConnectedChange={setTabStrokeConnected}
      explorerNoBadge={explorerNoBadge}
      onExplorerNoBadgeChange={setExplorerNoBadge}
      explorerFocusBadge={explorerFocusBadge}
      onExplorerFocusBadgeChange={setExplorerFocusBadge}
      explorerBadgeShowIndicator={explorerBadgeShowIndicator}
      onExplorerBadgeShowIndicatorChange={setExplorerBadgeShowIndicator}
      explorerOriginalDmBadge={explorerOriginalDmBadge}
      onExplorerOriginalDmBadgeChange={setExplorerOriginalDmBadge}
      explorerShowBreadcrumb={explorerShowBreadcrumb}
      onExplorerShowBreadcrumbChange={setExplorerShowBreadcrumb}
      showFullBreadcrumbWhenDetached={showFullBreadcrumbWhenDetached}
      onShowFullBreadcrumbWhenDetachedChange={setShowFullBreadcrumbWhenDetached}
      fullTint={fullTint}
      onFullTintChange={setFullTint}
      selectionTint={selectionTint}
      onSelectionTintChange={setSelectionTint}
      footerTint={footerTint}
      onFooterTintChange={setFooterTint}
      tabTint={tabTint}
      onTabTintChange={setTabTint}
      splitView={splitView}
      onSplitViewChange={setSplitView}
      toggleOpensDmIfClosed={toggleOpensDmIfClosed}
      onToggleOpensDmIfClosedChange={setToggleOpensDmIfClosed}
      showAssetInIsolation={showAssetInIsolation}
      onShowAssetInIsolationChange={setShowAssetInIsolation}
      editDatamodelShowStroke={editDatamodelShowStroke}
      onEditDatamodelShowStrokeChange={setEditDatamodelShowStroke}
      hideAssetTinting={hideAssetTinting}
      onHideAssetTintingChange={setHideAssetTinting}
      panelTitlesLeftAligned={panelTitlesLeftAligned}
      onPanelTitlesLeftAlignedChange={setPanelTitlesLeftAligned}
      onOpenFloatingProperties={() => {}}
      onOpenFloatingExplorer={() => {}}
    />
  )
}

function PreviewCard({
  id,
  title,
  meta,
  heightClass,
  children,
}: {
  id: RegionId
  title: string
  meta: string
  heightClass: string
  children: ReactNode
}) {
  return (
    <article id={`preview-${id}`} className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>{title}</h3>
        <p className={styles.cardMeta}>{meta}</p>
      </div>
      <div className={`${styles.preview} ${heightClass}`}>
        <div className={styles.previewInner}>{children}</div>
      </div>
    </article>
  )
}

function StudioCrop({ variant }: { variant: 'full' | 'top' | 'right' | 'bottom' | 'footer' }) {
  const className = {
    full: styles.scaledStudio,
    top: styles.scaledStudioTop,
    right: styles.scaledStudioRight,
    bottom: styles.scaledStudioBottom,
    footer: styles.scaledStudioFooter,
  }[variant]

  return (
    <div className={className}>
      <StudioWindowsOS />
    </div>
  )
}

export default function ComponentGallery() {
  const [activeRegion, setActiveRegion] = useState<RegionId | null>(null)

  const scrollTo = useCallback((region: RegionId) => {
    setActiveRegion(region)
    document.getElementById(`preview-${region}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const mapCell = (region: RegionId, label: string, className: string) => (
    <button
      type="button"
      className={`${styles.mapCell} ${className} ${activeRegion === region ? styles.mapCellActive : ''}`}
      onClick={() => scrollTo(region)}
    >
      {label}
    </button>
  )

  return (
    <div className={`${styles.root} galleryRoot`}>
      <header className={styles.header}>
        <h1 className={styles.title}>UI component gallery</h1>
        <p className={styles.subtitle}>
          Live previews of every major surface. Click a region in the map to jump to its preview.
          Return to the app with <code>?view=app</code> or remove <code>?view=gallery</code> from the
          URL.
        </p>
      </header>

      <section className={styles.mapSection}>
        <h2 className={styles.sectionTitle}>Studio shell map</h2>
        <div className={styles.shellMap} role="img" aria-label="Studio layout regions">
          {mapCell('appbar', 'App bar', styles.mapAppBar)}
          {mapCell('ribbon', 'Legacy ribbon + toolbar', styles.mapRibbon)}
          {mapCell('workspace', 'Workspace', styles.mapWorkspace)}
          <div className={styles.mapRight}>
            <button
              type="button"
              className={`${styles.mapRightPanel} ${activeRegion === 'explorer' ? styles.mapCellActive : ''}`}
              onClick={() => scrollTo('explorer')}
            >
              Explorer
            </button>
            <button
              type="button"
              className={`${styles.mapRightPanel} ${activeRegion === 'properties' ? styles.mapCellActive : ''}`}
              onClick={() => scrollTo('properties')}
            >
              Properties
            </button>
            <button
              type="button"
              className={`${styles.mapRightPanel} ${activeRegion === 'prototype' ? styles.mapCellActive : ''}`}
              onClick={() => scrollTo('prototype')}
            >
              Prototype settings
            </button>
          </div>
          {mapCell('dock-output', 'Output · Asset Manager', styles.mapDock)}
          {mapCell('command', 'Command bar', styles.mapCommand)}
          {mapCell('footer', 'Footer', styles.mapFooter)}
        </div>
      </section>

      <div className={styles.grid}>
        <article id="preview-workspace" className={`${styles.card} ${styles.gridWide}`}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Full Studio frame</h3>
            <p className={styles.cardMeta}>StudioWindowsOS — scaled live preview</p>
          </div>
          <div className={`${styles.preview} ${styles.previewScaled}`}>
            <StudioCrop variant="full" />
          </div>
        </article>

        <PreviewCard
          id="appbar"
          title="App bar"
          meta="StudioWindowsOS — title bar, menus, window controls"
          heightClass={styles.previewShort}
        >
          <StudioCrop variant="top" />
        </PreviewCard>

        <PreviewCard
          id="ribbon"
          title="Legacy ribbon"
          meta="@mdi/legacy-ribbon — mezzanine, tabs, playback"
          heightClass={styles.previewRibbon}
        >
          <LegacyRibbon />
        </PreviewCard>

        <PreviewCard
          id="ribbon-toolbar"
          title="Ribbon toolbar"
          meta="@mdi/legacy-ribbon — transform / part / material tools"
          heightClass={styles.previewToolbar}
        >
          <RibbonToolbar />
        </PreviewCard>

        <PreviewCard
          id="explorer"
          title="Explorer + right rail"
          meta="ExplorerTree · PanelChrome — cropped from live frame"
          heightClass={styles.previewTall}
        >
          <StudioCrop variant="right" />
        </PreviewCard>

        <PreviewCard
          id="properties"
          title="Properties panel"
          meta="PropertiesPanel.tsx"
          heightClass={styles.previewTall}
        >
          <div className={styles.pairRow}>
            <div>
              <p className={styles.pairLabel}>Empty (sim)</p>
              <PropertiesPanel empty />
            </div>
            <div>
              <p className={styles.pairLabel}>With selection</p>
              <PropertiesPanel />
            </div>
          </div>
        </PreviewCard>

        <PreviewCard
          id="prototype"
          title="Prototype settings"
          meta="InteractionSettingsPanel.tsx"
          heightClass={styles.previewTall}
        >
          <GalleryInteractionSettings />
        </PreviewCard>

        <PreviewCard
          id="dock-output"
          title="Output panel"
          meta="OutputPanel.tsx"
          heightClass={styles.previewMedium}
        >
          <OutputPanel entries={SAMPLE_OUTPUT} titleAlign="left" />
        </PreviewCard>

        <PreviewCard
          id="dock-assets"
          title="Asset Manager"
          meta="AssetManagerPanel.tsx"
          heightClass={styles.previewTall}
        >
          <AssetManagerPanel fillDock titleAlign="left" />
        </PreviewCard>

        <PreviewCard
          id="command"
          title="Command bar"
          meta="StudioWindowsOS — command input and run controls"
          heightClass={styles.previewShort}
        >
          <StudioCrop variant="bottom" />
        </PreviewCard>

        <PreviewCard
          id="footer"
          title="Footer"
          meta="StudioWindowsOS — questions and recent actions"
          heightClass={styles.previewShort}
        >
          <StudioCrop variant="footer" />
        </PreviewCard>

        <PreviewCard
          id="viewport-client"
          title="Client sim viewport"
          meta="ClientSim.tsx"
          heightClass={styles.previewShort}
        >
          <div className={`${styles.previewInner} ${styles.previewInnerContain}`}>
            <ClientSim />
          </div>
        </PreviewCard>

        <PreviewCard
          id="viewport-server"
          title="Server sim viewport"
          meta="ServerSim.tsx"
          heightClass={styles.previewShort}
        >
          <div className={`${styles.previewInner} ${styles.previewInnerContain}`}>
            <ServerSim />
          </div>
        </PreviewCard>
      </div>
    </div>
  )
}
