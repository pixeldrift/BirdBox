import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { TriangleGlyph } from '@/components/icons'
import { SCROLL_SLACK, useScrollFade } from '@/lib/useScrollFade'

// Marks the app's bordered shell in App.tsx so popovers can clamp their
// placement to it instead of the full browser viewport.
export const APP_VIEWPORT_ID = 'app-viewport'

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
 * Purely visual scroll position indicator: a recessed channel with a small
 * raised orange thumb. Only visible while actively scrolling (fades out
 * shortly after, like a native scrollbar) and not itself draggable — dragging
 * the thumb to move content is the opposite of how a touch scroll works
 * (drag up to see what's below), which read as backwards. Rendered the same
 * "sticky + explicit pixel height + cancelling negative margin" way as the
 * fade bars above, so it never needs an extra flex-1 wrapper (which collapses
 * to zero height — a flex-basis:0% item needs a definite-height ancestor to
 * size against, and during the popover's own natural-height measurement pass
 * the ancestor's height is still indeterminate).
 */
export function CustomScrollbar({
  scrollTop,
  scrollHeight,
  clientHeight,
  isScrolling,
}: {
  scrollTop: number
  scrollHeight: number
  clientHeight: number
  isScrolling: boolean
}) {
  const usableHeight = Math.max(0, clientHeight - SCROLLBAR_INSET * 2)
  const thumbHeight = Math.min(usableHeight, Math.max(SCROLLBAR_MIN_THUMB, (clientHeight / Math.max(1, scrollHeight)) * usableHeight))
  const maxTravel = Math.max(0, usableHeight - thumbHeight)
  const maxScroll = Math.max(0, scrollHeight - clientHeight)
  const thumbTop = maxScroll > 0 ? (scrollTop / maxScroll) * maxTravel : 0

  if (scrollHeight <= clientHeight + SCROLL_SLACK || clientHeight === 0) return null

  return (
    <div
      className="pointer-events-none sticky top-0 z-20 transition-opacity duration-300"
      style={{ height: clientHeight, marginBottom: -clientHeight, marginRight: -SCROLLBAR_GUTTER, opacity: isScrolling ? 1 : 0 }}
    >
      <div
        className="clay-inset absolute right-1 rounded-full"
        style={{ top: SCROLLBAR_INSET, bottom: SCROLLBAR_INSET, width: SCROLLBAR_WIDTH }}
      >
        <div className="clay-accent-soft absolute left-0 rounded-full" style={{ top: thumbTop, height: thumbHeight, width: SCROLLBAR_WIDTH }} />
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
      className="pointer-events-none sticky bottom-0 z-10 -mt-16 h-16"
      style={{ background: 'linear-gradient(to top, var(--cream-panel), transparent)' }}
    />
  )
}

function ScrollableContent({ children }: { children: React.ReactNode }) {
  const { ref, isScrolling, canScrollUp, canScrollDown, scrollTop, scrollHeight, clientHeight } = useScrollFade<HTMLDivElement>()

  return (
    <div ref={ref} data-popover-scroll className="min-h-0 flex-1 overflow-y-auto pr-6 pb-1">
      <ScrollFadeTop show={canScrollUp} />
      <CustomScrollbar scrollTop={scrollTop} scrollHeight={scrollHeight} clientHeight={clientHeight} isScrolling={isScrolling} />
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
  onStep?: (delta: number) => void
  children: React.ReactNode
  widthClassName?: string
  // Caps how tall the scrollable content area is allowed to naturally grow
  // before it scrolls internally (e.g. a tall grid picker), independent of
  // the viewport heightCap below. Lets content that would rather stay
  // compact (not fill all available screen space) use the *same* single
  // scroll region/fade/scrollbar as everything else, instead of nesting a
  // second scrollable div inside it — which would trap that inner
  // scrollbar an extra padding-gutter's depth away from the card's edge.
  contentMaxHeight?: number
}

const MARGIN = 16
const GAP = 14

const SCRUB_PX_PER_STEP = 18
const SCRUB_DRAG_THRESHOLD = 6

// A small arrow flanking the popover title: tap it for a single step, or
// press and drag horizontally (in either direction, from either arrow) to
// scrub the value continuously — one step per SCRUB_PX_PER_STEP dragged.
function TitleScrubArrow({ dir, onStep }: { dir: 'left' | 'right'; onStep: (delta: number) => void }) {
  const dragRef = useRef({ active: false, startX: 0, appliedSteps: 0, dragged: false })

  function onPointerDown(e: ReactPointerEvent<HTMLButtonElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { active: true, startX: e.clientX, appliedSteps: 0, dragged: false }
  }

  // Pointer capture routes subsequent move/up events here even off-element,
  // but a plain hover (no button pressed) also fires onPointerMove — guard on
  // `active` so idle mouse movement never gets mistaken for a scrub gesture.
  function onPointerMove(e: ReactPointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current
    if (!drag.active) return
    const dx = e.clientX - drag.startX
    if (Math.abs(dx) > SCRUB_DRAG_THRESHOLD) drag.dragged = true
    const steps = Math.trunc(dx / SCRUB_PX_PER_STEP)
    if (steps !== drag.appliedSteps) {
      onStep(steps - drag.appliedSteps)
      drag.appliedSteps = steps
    }
  }

  function onPointerUp() {
    if (!dragRef.current.active) return
    if (!dragRef.current.dragged) onStep(dir === 'left' ? -1 : 1)
    dragRef.current.active = false
  }

  return (
    <button
      type="button"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className="clay-interactive flex touch-none items-center justify-center rounded-full p-2 active:scale-90"
      aria-label={dir === 'left' ? 'Decrease' : 'Increase'}
    >
      <TriangleGlyph dir={dir} className="h-4 w-4" />
    </button>
  )
}

interface Placement {
  top: number
  left: number
  tailLeft: number
  placement: 'below' | 'above'
  maxHeight: number
  maxWidth: number
}

interface Bounds {
  left: number
  top: number
  right: number
  bottom: number
}

// The layout viewport (window.innerWidth/Height) does NOT shrink when a mobile
// on-screen keyboard opens — only visualViewport does. Sizing against innerHeight
// alone can leave a popover's bottom (e.g. its submit button) hidden behind the
// keyboard even though the math "fits". Prefer visualViewport wherever available.
//
// Popovers should also never spill outside the app's own bordered shell (its
// "viewport", visually) — so intersect the keyboard-aware window bounds with
// that shell's own rect, falling back to the window bounds alone if the shell
// isn't found (e.g. in isolated tests).
function getPlacementBounds(): Bounds {
  const vv = window.visualViewport
  const windowBounds: Bounds = vv
    ? { left: vv.offsetLeft, top: vv.offsetTop, right: vv.offsetLeft + vv.width, bottom: vv.offsetTop + vv.height }
    : { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight }

  const shell = document.getElementById(APP_VIEWPORT_ID)
  if (!shell) return windowBounds
  const shellRect = shell.getBoundingClientRect()
  return {
    left: Math.max(windowBounds.left, shellRect.left),
    top: Math.max(windowBounds.top, shellRect.top),
    right: Math.min(windowBounds.right, shellRect.right),
    bottom: Math.min(windowBounds.bottom, shellRect.bottom),
  }
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

export function Popover({
  open,
  anchorEl,
  onClose,
  title,
  onStep,
  children,
  widthClassName = 'w-[calc(100vw-2rem)] max-w-sm',
  contentMaxHeight,
}: PopoverProps) {
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
      const { left: vpLeft, top: vpTop, right: vpRight, bottom: vpBottom } = getPlacementBounds()

      // The card's own CSS width (widthClassName) is sized off 100vw, with no
      // idea where the app's own bordered pane actually sits — on a narrow
      // screen that can make it wider than the pane's available inner space,
      // so centering math below has nowhere to put equal margins on both
      // sides (or, worse, the card ends up flush against the border). Cap it
      // to what the pane can actually offer before measuring/centering.
      const maxWidth = vpRight - vpLeft - MARGIN * 2

      // Measure the card's natural (unconstrained) size first. Use
      // offsetWidth/offsetHeight rather than getBoundingClientRect() here:
      // the card's entrance animation (scale(0.97) -> scale(1)) is a CSS
      // transform, and transforms are applied after layout — so a rect read
      // mid-animation reports a transiently shrunk size, while the offset*
      // properties reflect true layout size regardless of transform.
      card.style.maxHeight = 'none'
      card.style.maxWidth = `${maxWidth}px`
      const anchorRect = anchorEl.getBoundingClientRect()
      const width = card.offsetWidth
      let naturalHeight = card.offsetHeight

      // If a cap was given, don't let it inflate the *whole* natural height —
      // only the scrollable region's own share of it. Everything else (title,
      // padding) still gets its real natural size; only the part that would
      // otherwise scroll gets clamped here, so it scrolls internally via the
      // one shared ScrollableContent instead of the caller nesting a second
      // scrollable div (and a second, doubly-inset scrollbar) inside it.
      if (contentMaxHeight != null) {
        const scrollEl = card.querySelector<HTMLElement>('[data-popover-scroll]')
        if (scrollEl) {
          const scrollNaturalHeight = scrollEl.offsetHeight
          const chromeHeight = naturalHeight - scrollNaturalHeight
          naturalHeight = chromeHeight + Math.min(scrollNaturalHeight, contentMaxHeight)
        }
      }

      // Always horizontally centered in the pane rather than centered under
      // the anchor — the anchor can sit anywhere across the width of the
      // header/grid, and centering on it risked the card creeping close to
      // (or past) the app's own border on narrow screens. The tail below
      // still points back at the anchor's actual x position, so context
      // isn't lost by centering the card itself.
      let left = vpLeft + (vpRight - vpLeft - width) / 2
      left = Math.min(Math.max(left, vpLeft + MARGIN), Math.max(vpLeft + MARGIN, vpRight - width - MARGIN))

      // Expand to fit the content, capped by the (keyboard-aware, shell-clamped) bounds — scrolls
      // internally past that point — but keep the card adjacent to its anchor. Only slide it toward
      // the center as far as needed to stay fully visible, so the tail never ends up pointing at a
      // distant, unrelated element just because it happened to land near wherever it centered.
      const heightCap = vpBottom - vpTop - MARGIN * 2
      const height = Math.min(naturalHeight, heightCap)

      const spaceBelow = vpBottom - anchorRect.bottom - GAP
      const spaceAbove = anchorRect.top - vpTop - GAP
      const placement: 'below' | 'above' = spaceBelow >= spaceAbove ? 'below' : 'above'

      const preferredTop = placement === 'below' ? anchorRect.bottom + GAP : anchorRect.top - GAP - height
      const top = Math.min(Math.max(preferredTop, vpTop + MARGIN), Math.max(vpTop + MARGIN, vpBottom - height - MARGIN))

      const anchorCenterX = anchorRect.left + anchorRect.width / 2
      const tailLeft = Math.min(Math.max(anchorCenterX - left, 24), width - 24)

      // Apply the real cap to the DOM directly, not just via React state: this
      // function starts every call by reaching past React and setting
      // maxHeight to 'none' on the raw element to measure its natural size.
      // On any call after the first, React's own diffing compares the new
      // `pos.maxHeight` against what it last rendered — and if this pass
      // recomputes the *same* height as before (the common case, since only
      // a few callers ever need a second value), React sees no change and
      // skips writing it back, leaving the DOM stuck at the 'none' we just
      // set ourselves. That silently uncaps the popover, which is exactly
      // the "still clipped at the bottom" bug this was supposed to prevent.
      card.style.maxHeight = `${height}px`
      setPos({ top, left, tailLeft, placement, maxHeight: height, maxWidth })
    }
    place()
    // Descendants like the box grid's scrollbar/fade depend on useScrollFade
    // state that isn't committed to the DOM yet on this first pass (its metrics
    // update via a state change queued from a ref callback, landing a render
    // *after* this effect reads the card's height) — so the very first call
    // above can under-measure the natural height by however tall those pieces
    // turn out to be. Re-measure once more after that settles so the popover
    // doesn't get stuck permanently a few px short, clipping its own content.
    const raf = requestAnimationFrame(place)
    window.addEventListener('resize', place)
    window.visualViewport?.addEventListener('resize', place)
    window.visualViewport?.addEventListener('scroll', place)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', place)
      window.visualViewport?.removeEventListener('resize', place)
      window.visualViewport?.removeEventListener('scroll', place)
    }
  }, [open, anchorEl, contentMaxHeight])

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
    maxWidth: pos?.maxWidth,
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
          className="clay flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.75rem] border-[3px] py-5 pr-3 pl-5"
          style={{ borderColor: 'var(--accent)', background: 'var(--cream-panel)' }}
        >
          {title && (
            <div className="mb-4 flex shrink-0 items-center justify-center gap-3">
              {onStep && <TitleScrubArrow dir="left" onStep={onStep} />}
              <h2 className="font-display text-center text-xl font-bold" style={{ color: 'var(--ink)' }}>
                {title}
              </h2>
              {onStep && <TitleScrubArrow dir="right" onStep={onStep} />}
            </div>
          )}
          <ScrollableContent>{children}</ScrollableContent>
        </div>
      </div>
    </div>,
    document.body,
  )
}
