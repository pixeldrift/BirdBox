import { useCallback, useRef, useState } from 'react'

interface ScrollMetrics {
  canScrollUp: boolean
  canScrollDown: boolean
  scrollTop: number
  scrollHeight: number
  clientHeight: number
}

const INITIAL: ScrollMetrics = { canScrollUp: false, canScrollDown: false, scrollTop: 0, scrollHeight: 0, clientHeight: 0 }

// A popover's height comes from measuring its own natural size and re-applying
// it as a fixed maxHeight; that round trip can leave a few px of sub-pixel
// slack (flex distribution rounds slightly differently in an auto-height vs.
// fixed-height pass). Ignore overflow below this so that slack doesn't read
// as "more content below" and paint a distracting near-full-height scrollbar.
export const SCROLL_SLACK = 20

// How long the scrollbar stays visible after the last scroll event before
// fading out again, matching the native-scrollbar "only while scrolling" feel.
const SCROLLBAR_HIDE_DELAY = 800

/** Tracks a scrollable element's position/size so callers can show a fade
 * indicator and/or a custom scrollbar instead of an abrupt, unindicated cut.
 *
 * Uses a callback ref rather than `useRef` + `useEffect([])`: the latter only
 * fires once, on the *hook-owning component's* mount. If that component stays
 * mounted while the actual scrollable element mounts/unmounts later (e.g. it
 * lives inside a conditionally-rendered popover that starts closed), the
 * effect already ran with a null ref and never gets another chance to attach
 * its listeners once the element shows up. A callback ref fires exactly when
 * the DOM node itself attaches, independent of the owning component's own
 * lifecycle, so it works correctly either way. */
export function useScrollFade<T extends HTMLElement>() {
  const [metrics, setMetrics] = useState<ScrollMetrics>(INITIAL)
  const [isScrolling, setIsScrolling] = useState(false)
  const containerRef = useRef<T | null>(null)
  const cleanupRef = useRef<() => void>(() => {})

  const ref = useCallback((el: T | null) => {
    cleanupRef.current()
    containerRef.current = el
    if (!el) return
    let hideTimer: ReturnType<typeof setTimeout> | undefined
    function update() {
      if (!el) return
      setMetrics({
        canScrollUp: el.scrollTop > 1,
        canScrollDown: el.scrollTop + el.clientHeight < el.scrollHeight - SCROLL_SLACK,
        scrollTop: el.scrollTop,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
      })
    }
    function onScroll() {
      update()
      setIsScrolling(true)
      clearTimeout(hideTimer)
      hideTimer = setTimeout(() => setIsScrolling(false), SCROLLBAR_HIDE_DELAY)
    }
    update()
    el.addEventListener('scroll', onScroll)
    const ro = new ResizeObserver(update)
    ro.observe(el)
    cleanupRef.current = () => {
      el.removeEventListener('scroll', onScroll)
      ro.disconnect()
      clearTimeout(hideTimer)
    }
  }, [])

  return { ref, containerRef, isScrolling, ...metrics }
}
