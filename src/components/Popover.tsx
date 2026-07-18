import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'

/**
 * Pointer triangle drawn as two separate SVG paths: a filled triangle whose base
 * sinks a few px into the card (masking the card's own border stroke where the
 * tail attaches), and an open two-sided stroke that stops short of that base so
 * no border line ever crosses behind the arrow.
 */
function PopoverTail({ left, pointDown }: { left: number; pointDown: boolean }) {
  const gradientId = `popover-tail-fill-${useId()}`
  return (
    <svg
      width="28"
      height="18"
      viewBox="0 0 28 18"
      className="pointer-events-none absolute"
      style={{
        left: left - 14,
        top: pointDown ? undefined : -15,
        bottom: pointDown ? -15 : undefined,
        transform: pointDown ? 'rotate(180deg)' : undefined,
      }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="45%" stopColor="var(--cream-panel)" />
        </linearGradient>
      </defs>
      <path d="M2 18 L14 3 L26 18 Z" fill={`url(#${gradientId})`} />
      <path d="M2 15 L14 3 L26 15" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

interface PopoverProps {
  open: boolean
  anchorEl: HTMLElement | null
  onClose: () => void
  title?: string
  children: React.ReactNode
  widthClassName?: string
}

const MARGIN = 16
const GAP = 14

interface Placement {
  top: number
  left: number
  tailLeft: number
  placement: 'below' | 'above'
  maxHeight: number
}

// The layout viewport (window.innerWidth/Height) does NOT shrink when a mobile
// on-screen keyboard opens — only visualViewport does. Sizing against innerHeight
// alone can leave a popover's bottom (e.g. its submit button) hidden behind the
// keyboard even though the math "fits". Prefer visualViewport wherever available.
function getViewport() {
  const vv = window.visualViewport
  if (vv) return { width: vv.width, height: vv.height, offsetTop: vv.offsetTop, offsetLeft: vv.offsetLeft }
  return { width: window.innerWidth, height: window.innerHeight, offsetTop: 0, offsetLeft: 0 }
}

// Ref-counted so nested popovers (e.g. band details + its color palette) don't
// have the first one to close prematurely re-enable background scroll.
let scrollLockCount = 0
let previousBodyOverflow = ''

function lockBodyScroll() {
  if (scrollLockCount === 0) {
    previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  scrollLockCount++
}

function unlockBodyScroll() {
  scrollLockCount = Math.max(0, scrollLockCount - 1)
  if (scrollLockCount === 0) {
    document.body.style.overflow = previousBodyOverflow
  }
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
      // Measure the card's natural (unconstrained) size first.
      card.style.maxHeight = 'none'
      const anchorRect = anchorEl.getBoundingClientRect()
      const cardRect = card.getBoundingClientRect()
      const width = cardRect.width
      const naturalHeight = cardRect.height
      const vp = getViewport()
      const vpLeft = vp.offsetLeft
      const vpTop = vp.offsetTop
      const vpRight = vp.offsetLeft + vp.width
      const vpBottom = vp.offsetTop + vp.height

      let left = anchorRect.left + anchorRect.width / 2 - width / 2
      left = Math.min(Math.max(left, vpLeft + MARGIN), Math.max(vpLeft + MARGIN, vpRight - width - MARGIN))

      // Expand to fit the content, capped by the (keyboard-aware) viewport — scrolls internally
      // past that point — but keep the card adjacent to its anchor. Only slide it toward the
      // center as far as needed to stay fully visible, so the tail never ends up pointing at a
      // distant, unrelated element just because it happened to land near wherever it centered.
      const heightCap = vp.height - MARGIN * 2
      const height = Math.min(naturalHeight, heightCap)

      const spaceBelow = vpBottom - anchorRect.bottom - GAP
      const spaceAbove = anchorRect.top - vpTop - GAP
      const placement: 'below' | 'above' = spaceBelow >= spaceAbove ? 'below' : 'above'

      const preferredTop = placement === 'below' ? anchorRect.bottom + GAP : anchorRect.top - GAP - height
      const top = Math.min(Math.max(preferredTop, vpTop + MARGIN), Math.max(vpTop + MARGIN, vpBottom - height - MARGIN))

      const anchorCenterX = anchorRect.left + anchorRect.width / 2
      const tailLeft = Math.min(Math.max(anchorCenterX - left, 24), width - 24)

      setPos({ top, left, tailLeft, placement, maxHeight: height })
    }
    place()
    window.addEventListener('resize', place)
    window.visualViewport?.addEventListener('resize', place)
    window.visualViewport?.addEventListener('scroll', place)
    return () => {
      window.removeEventListener('resize', place)
      window.visualViewport?.removeEventListener('resize', place)
      window.visualViewport?.removeEventListener('scroll', place)
    }
  }, [open, anchorEl])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    lockBodyScroll()
    return () => unlockBodyScroll()
  }, [open])

  if (!open) return null

  const cardStyle: CSSProperties = {
    top: pos?.top ?? -9999,
    left: pos?.left ?? -9999,
    maxHeight: pos?.maxHeight,
    visibility: pos ? 'visible' : 'hidden',
    ['--pop-origin-x' as string]: pos ? `${pos.tailLeft}px` : '50%',
  }

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-[#241f17]/25" onClick={onClose} />
      {/* Outer wrapper: measured/positioned, holds the tail (which must NOT be clipped). */}
      <div ref={cardRef} className={`popover-pop fixed flex flex-col ${widthClassName}`} style={cardStyle}>
        {pos && <PopoverTail left={pos.tailLeft} pointDown={pos.placement === 'above'} />}
        {/* Inner card: the visible surface, clipped to its rounded corners and maxHeight. */}
        <div
          className="clay flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.75rem] border-[3px] p-5"
          style={{ borderColor: 'var(--accent)', background: 'var(--cream-panel)' }}
        >
          {title && (
            <h2 className="font-display mb-4 shrink-0 text-center text-xl font-bold" style={{ color: 'var(--ink)' }}>
              {title}
            </h2>
          )}
          <div className="min-h-0 flex-1 overflow-y-auto pb-1">{children}</div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
