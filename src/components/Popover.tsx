import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { VerticalDragGlyph } from '@/components/icons'
import { SCROLL_SLACK, useScrollFade } from '@/lib/useScrollFade'

const SCROLLBAR_WIDTH = 14
const SCROLLBAR_INSET = 6
const SCROLLBAR_MIN_THUMB = 30
// Matches the `pr-6` right padding on every scrollable container the scrollbar
// is used in. The wrapper below is laid out as a normal flow child, so its own
// box is confined to the *content* box (padding already excluded) — without
// clawing that space back via a negative margin, "right" offsets on the
// channel stay relative to the content edge and sit on top of real content
// instead of out in the reserved padding gutter.
const SCROLLBAR_GUTTER = 24

/**
 * Custom draggable scrollbar: a recessed channel with a small raised orange
 * thumb (a double-arrow icon marking it as a drag handle). Rendered the same
 * "sticky + explicit pixel height + cancelling negative margin" way as the
 * fade bars above, so it never needs an extra flex-1 wrapper (which collapses
 * to zero height — a flex-basis:0% item needs a definite-height ancestor to
 * size against, and during the popover's own natural-height measurement pass
 * the ancestor's height is still indeterminate).
 */
export function CustomScrollbar({
  containerRef,
  scrollTop,
  scrollHeight,
  clientHeight,
}: {
  containerRef: RefObject<HTMLElement | null>
  scrollTop: number
  scrollHeight: number
  clientHeight: number
}) {
  const draggingRef = useRef(false)
  const dragStartRef = useRef({ startY: 0, startScrollTop: 0 })
  const metricsRef = useRef({ maxTravel: 0, maxScroll: 0 })

  const usableHeight = Math.max(0, clientHeight - SCROLLBAR_INSET * 2)
  const thumbHeight = Math.min(usableHeight, Math.max(SCROLLBAR_MIN_THUMB, (clientHeight / Math.max(1, scrollHeight)) * usableHeight))
  const maxTravel = Math.max(0, usableHeight - thumbHeight)
  const maxScroll = Math.max(0, scrollHeight - clientHeight)
  const thumbTop = maxScroll > 0 ? (scrollTop / maxScroll) * maxTravel : 0
  metricsRef.current = { maxTravel, maxScroll }

  useEffect(() => {
    function move(e: PointerEvent) {
      if (!draggingRef.current || !containerRef.current) return
      const { maxTravel, maxScroll } = metricsRef.current
      if (maxTravel <= 0) return
      const dy = e.clientY - dragStartRef.current.startY
      containerRef.current.scrollTop = dragStartRef.current.startScrollTop + (dy / maxTravel) * maxScroll
    }
    function up() {
      draggingRef.current = false
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [containerRef])

  if (scrollHeight <= clientHeight + SCROLL_SLACK || clientHeight === 0) return null

  function onThumbPointerDown(e: ReactPointerEvent) {
    draggingRef.current = true
    dragStartRef.current = { startY: e.clientY, startScrollTop: containerRef.current?.scrollTop ?? 0 }
  }

  return (
    <div
      className="pointer-events-none sticky top-0 z-20"
      style={{ height: clientHeight, marginBottom: -clientHeight, marginRight: -SCROLLBAR_GUTTER }}
    >
      <div
        className="clay-inset absolute right-1 rounded-full"
        style={{ top: SCROLLBAR_INSET, bottom: SCROLLBAR_INSET, width: SCROLLBAR_WIDTH }}
      >
        <div
          className="clay-accent-soft clay-interactive pointer-events-auto absolute left-0 flex cursor-grab items-center justify-center rounded-full active:cursor-grabbing"
          style={{ top: thumbTop, height: thumbHeight, width: SCROLLBAR_WIDTH }}
          onPointerDown={onThumbPointerDown}
        >
          <VerticalDragGlyph className="h-2.5 w-2.5" style={{ color: '#fff8ee' }} />
        </div>
      </div>
    </div>
  )
}

/**
 * Sticky, height-cancelling fade bars for a scrollable container: each occupies
 * its normal spot in flow (so it doesn't disturb a flex-1/min-h-0 sizing chain
 * the way an extra wrapping flex item would) but a negative margin equal to
 * its own height removes that space back out, so it adds zero scroll distance
 * while still sticking to the edge as an overlay — a partially-cut-off row
 * (e.g. a tall grid picker) fades into the background instead of looking like
 * broken clipping. Place ScrollFadeTop as the first child and ScrollFadeBottom
 * as the last child of the scrollable element itself.
 */
export function ScrollFadeTop({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <div
      className="pointer-events-none sticky top-0 z-10 -mb-7 h-7"
      style={{ background: 'linear-gradient(to bottom, var(--cream-panel), transparent)' }}
    />
  )
}

export function ScrollFadeBottom({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <div
      className="pointer-events-none sticky bottom-0 z-10 -mt-9 h-9"
      style={{ background: 'linear-gradient(to top, var(--cream-panel), transparent)' }}
    />
  )
}

function ScrollableContent({ children }: { children: React.ReactNode }) {
  const { ref, containerRef, canScrollUp, canScrollDown, scrollTop, scrollHeight, clientHeight } = useScrollFade<HTMLDivElement>()

  return (
    <div ref={ref} className="min-h-0 flex-1 overflow-y-auto pr-6 pb-1">
      <ScrollFadeTop show={canScrollUp} />
      <CustomScrollbar containerRef={containerRef} scrollTop={scrollTop} scrollHeight={scrollHeight} clientHeight={clientHeight} />
      {children}
      <ScrollFadeBottom show={canScrollDown} />
    </div>
  )
}

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
          <ScrollableContent>{children}</ScrollableContent>
        </div>
      </div>
    </div>,
    document.body,
  )
}
