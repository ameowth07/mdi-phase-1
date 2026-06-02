import type { HTMLAttributes, MouseEvent } from 'react'
import { publicAssetUrl } from '../../publicAssetUrl'
import { TabPlaceWorkspaceIcon, TabServerSimDocumentIcon } from './documentTabIcons'
import TabWithPathTooltip from './TabWithPathTooltip'
import styles from './StudioWindowsOS.module.css'

export type DocumentPlaceTabProps = {
  label: string
  path: string
  tabClassName: string
  leadingIcon?: 'place' | 'server'
  selected?: boolean
  onActivate?: () => void
  onClose?: () => void
  dragTabIndex?: number
  dragClassName?: string
  dragTabProps?: React.HTMLAttributes<HTMLElement>
}

function TabCloseButton({ onClose }: { onClose: (e: MouseEvent) => void }) {
  return (
    <button
      type="button"
      className={styles.tabClose}
      aria-label="Close tab"
      onPointerDown={(e) => {
        e.stopPropagation()
        onClose(e)
      }}
      onClick={(e) => {
        e.stopPropagation()
        onClose(e)
      }}
    >
      <img src={publicAssetUrl('assets/tab-close.svg')} alt="" />
    </button>
  )
}

export default function DocumentPlaceTab({
  label,
  path,
  tabClassName,
  leadingIcon = 'place',
  selected = true,
  onActivate,
  onClose,
  dragTabIndex,
  dragClassName = '',
  dragTabProps,
}: DocumentPlaceTabProps) {
  const tabClass = [tabClassName, dragClassName].filter(Boolean).join(' ')
  return (
    <TabWithPathTooltip
      path={path}
      role="tab"
      tabIndex={dragTabIndex ?? 0}
      aria-selected={selected}
      className={tabClass}
      {...(dragTabProps as HTMLAttributes<HTMLElement> | undefined)}
      onPointerDown={(e) => {
        e.stopPropagation()
        dragTabProps?.onPointerDown?.(e)
      }}
      onClick={(e) => {
        e.stopPropagation()
        dragTabProps?.onClick?.(e)
        if (!e.defaultPrevented) onActivate?.()
      }}
    >
      {leadingIcon === 'server' ? <TabServerSimDocumentIcon /> : <TabPlaceWorkspaceIcon />}
      <span>{label}</span>
      {onClose ? (
        <TabCloseButton
          onClose={(e) => {
            e.stopPropagation()
            onClose()
          }}
        />
      ) : (
        <button type="button" className={styles.tabClose} aria-label="Close tab">
          <img src={publicAssetUrl('assets/tab-close.svg')} alt="" />
        </button>
      )}
    </TabWithPathTooltip>
  )
}
