import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'

interface PopoverProps {
  open: boolean
  anchorEl: HTMLElement | null
  onClose: () => void
  title?: string
  children: React.ReactNode
  widthClassName?: string
}

const MARGIN = 12
const GAP = 14

interface Placement {
  top: number
  left: number
  tailLeft: number
  placement: 'below' | 'above'
}

export function Popover({ open, anchorEl, onClose, title, children, widthClassName = 'w-[calc(100vw-2rem)] max-w-sm' }: PopoverProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<Placement | null>(null)

  useLayoutEffect(() => {
    if (!open || !anchorEl) {
      setPos(null)
      return
    }
    function place() {
      const card = cardRef.current
      if (!card || !anchorEl) return
      const anchorRect = anchorEl.getBoundingClientRect()
      const cardRect = card.getBoundingClientRect()
      const width = cardRect.width
      const height = cardRect.height

      let left = anchorRect.left + anchorRect.width / 2 - width / 2
      left = Math.min(Math.max(left, MARGIN), Math.max(MARGIN, window.innerWidth - width - MARGIN))

      const spaceBelow = window.innerHeight - anchorRect.bottom
      const spaceAbove = anchorRect.top
      const placement: 'below' | 'above' = spaceBelow >= height + GAP + MARGIN || spaceBelow >= spaceAbove ? 'below' : 'above'

      const rawTop = placement === 'below' ? anchorRect.bottom + GAP : anchorRect.top - height - GAP
      const top = Math.min(Math.max(rawTop, MARGIN), Math.max(MARGIN, window.innerHeight - height - MARGIN))

      const anchorCenter = anchorRect.left + anchorRect.width / 2
      const tailLeft = Math.min(Math.max(anchorCenter - left, 24), width - 24)

      setPos({ top, left, tailLeft, placement })
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [open, anchorEl])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const cardStyle: CSSProperties = {
    top: pos?.top ?? -9999,
    left: pos?.left ?? -9999,
    visibility: pos ? 'visible' : 'hidden',
    borderColor: 'var(--accent)',
    background: 'var(--cream-panel)',
    ['--pop-origin-x' as string]: pos ? `${pos.tailLeft}px` : '50%',
  }

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-[#241f17]/25" onClick={onClose} />
      <div ref={cardRef} className={`clay popover-pop fixed rounded-[1.75rem] border-[3px] p-5 ${widthClassName}`} style={cardStyle}>
        {pos && (
          <span
            className={`popover-tail ${pos.placement === 'above' ? 'tail-down -bottom-[13px]' : '-top-[13px]'}`}
            style={{ left: pos.tailLeft - 13 }}
          />
        )}
        {title && <h2 className="font-display mb-4 text-center text-xl font-bold" style={{ color: 'var(--ink)' }}>{title}</h2>}
        <div className="max-h-[70vh] overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
