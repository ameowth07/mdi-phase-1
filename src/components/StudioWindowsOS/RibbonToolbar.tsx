import type { ReactNode } from 'react'
import {
  Anchor,
  Box,
  Boxes,
  ChevronDown,
  FileCode2,
  FolderTree,
  Group,
  Layers2,
  Lock,
  Maximize2,
  Monitor,
  MousePointer2,
  Move,
  Mountain,
  PackagePlus,
  Paintbrush,
  Palette,
  RotateCw,
  Shapes,
  SlidersHorizontal,
  UserCircle2,
  Wrench,
} from 'lucide-react'
import css from './ribbon.module.css'

const ic = { size: 15 as const, strokeWidth: 1.5 as const }

function G24({ children }: { children: ReactNode }) {
  return (
    <div className={css.b24}>
      <div className={css.glyphCenter}>{children}</div>
    </div>
  )
}

function ChevSm() {
  return (
    <svg
      className={css.chevSvg}
      width={10}
      height={10}
      viewBox="0 0 10 10"
      aria-hidden
    >
      <path
        d="M2 3L5 6.2L8 3"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function VDiv() {
  return <div className={css.vDivider} aria-hidden />
}

function ToggleTool({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={css.toggleCol}>
      <button type="button" className={css.toggleBtn}>
        {children}
      </button>
      <div className={css.toggleLabel}>
        <span>{label}</span>
      </div>
    </div>
  )
}

function SplitTool({ label, main }: { label: string; main: ReactNode }) {
  return (
    <div className={css.splitTool}>
      <div className={css.splitTop}>
        <button type="button" className={css.splitMain}>
          {main}
        </button>
        <button type="button" className={css.splitDrop} aria-label="More options">
          <ChevSm />
        </button>
      </div>
      <div className={css.toggleLabel}>
        <span>{label}</span>
      </div>
    </div>
  )
}

function SpinPair() {
  return (
    <div className={css.spinCol}>
      <div className={css.spinRow}>
        <span className={css.checkFake} aria-hidden>
          <svg width={11} height={11} viewBox="0 0 11 11" aria-hidden>
            <path
              d="M2 5.5 L4.2 8 L9 2.5"
              stroke="#202227"
              strokeWidth="1.8"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <div className={css.spinBox}>
          <div className={css.spinBoxIcon}>
            <Move size={14} strokeWidth={1.5} aria-hidden />
          </div>
          <span className={css.spinBoxInput}>1 stud</span>
          <button type="button" className={css.spinBoxCtrl} aria-hidden tabIndex={-1}>
            <ChevronDown size={12} strokeWidth={1.5} aria-hidden />
          </button>
        </div>
      </div>
      <div className={css.spinRow}>
        <span className={css.checkFake} aria-hidden>
          <svg width={11} height={11} viewBox="0 0 11 11" aria-hidden>
            <path
              d="M2 5.5 L4.2 8 L9 2.5"
              stroke="#202227"
              strokeWidth="1.8"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <div className={css.spinBox}>
          <div className={css.spinBoxIcon}>
            <RotateCw size={14} strokeWidth={1.5} aria-hidden />
          </div>
          <span className={css.spinBoxInput}>45°</span>
          <button type="button" className={css.spinBoxCtrl} aria-hidden tabIndex={-1}>
            <ChevronDown size={12} strokeWidth={1.5} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  )
}

/** Lower ribbon row (Figma node 3841:115043). Icons use Lucide vectors (Figma MCP raster URLs expire). */
export function RibbonToolbar() {
  return (
    <div className={css.toolbar} data-node-id="3841:115043">
      <div className={css.toolGroup} data-node-id="3841:115045">
        <ToggleTool label="Select">
          <G24>
            <MousePointer2 {...ic} aria-hidden />
          </G24>
        </ToggleTool>
        <ToggleTool label="Move">
          <G24>
            <Move {...ic} aria-hidden />
          </G24>
        </ToggleTool>
        <ToggleTool label="Scale">
          <G24>
            <Maximize2 {...ic} aria-hidden />
          </G24>
        </ToggleTool>
        <ToggleTool label="Rotate">
          <G24>
            <RotateCw {...ic} aria-hidden />
          </G24>
        </ToggleTool>
        <ToggleTool label="Transform">
          <G24>
            <Layers2 {...ic} aria-hidden />
          </G24>
        </ToggleTool>
      </div>

      <VDiv />

      <div className={css.toolGroup} data-node-id="3841:115052">
        <SplitTool
          label="Geometric"
          main={
            <G24>
              <Shapes {...ic} aria-hidden />
            </G24>
          }
        />
        <SpinPair />
      </div>

      <VDiv />

      <div className={css.toolGroup} data-node-id="3841:115115">
        <SplitTool
          label="Part"
          main={
            <G24>
              <Box {...ic} aria-hidden />
            </G24>
          }
        />
        <ToggleTool label="Terrain">
          <G24>
            <Mountain {...ic} aria-hidden />
          </G24>
        </ToggleTool>
        <SplitTool
          label="Character"
          main={
            <G24>
              <UserCircle2 {...ic} aria-hidden />
            </G24>
          }
        />
        <SplitTool
          label="GUI"
          main={
            <G24>
              <Monitor {...ic} aria-hidden />
            </G24>
          }
        />
        <SplitTool
          label="Script"
          main={
            <G24>
              <FileCode2 {...ic} aria-hidden />
            </G24>
          }
        />
        <ToggleTool label="Import 3D">
          <G24>
            <PackagePlus {...ic} aria-hidden />
          </G24>
        </ToggleTool>
      </div>

      <VDiv />

      <div className={css.toolGroup} data-node-id="3841:115123">
        <SplitTool
          label="Material"
          main={
            <G24>
              <Paintbrush {...ic} aria-hidden />
            </G24>
          }
        />
        <SplitTool
          label="Color"
          main={
            <G24>
              <Palette {...ic} aria-hidden />
            </G24>
          }
        />
        <ToggleTool label="Group">
          <G24>
            <Group {...ic} aria-hidden />
          </G24>
        </ToggleTool>
        <SplitTool
          label="Lock"
          main={
            <G24>
              <Lock {...ic} aria-hidden />
            </G24>
          }
        />
        <SplitTool
          label="Anchor"
          main={
            <G24>
              <Anchor {...ic} aria-hidden />
            </G24>
          }
        />
      </div>

      <VDiv />

      <div className={css.toolGroup} data-node-id="3841:115131">
        <ToggleTool label="Toolbox">
          <G24>
            <Wrench {...ic} aria-hidden />
          </G24>
        </ToggleTool>
        <ToggleTool label="Explorer">
          <G24>
            <FolderTree {...ic} aria-hidden />
          </G24>
        </ToggleTool>
        <ToggleTool label="Properties">
          <G24>
            <SlidersHorizontal {...ic} aria-hidden />
          </G24>
        </ToggleTool>
        <ToggleTool label="Assets">
          <G24>
            <Boxes {...ic} aria-hidden />
          </G24>
        </ToggleTool>
      </div>
    </div>
  )
}
