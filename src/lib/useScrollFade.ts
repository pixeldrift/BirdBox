import { useEffect, useRef, useState } from 'react'

/** Tracks whether a scrollable element has more content above/below the
 * current view, so callers can show a fade indicator instead of an abrupt cut. */
export function useScrollFade<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [canScrollUp, setCanScrollUp] = useState(false)
  const [canScrollDown, setCanScrollDown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    function update() {
      if (!el) return
      setCanScrollUp(el.scrollTop > 1)
      setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 1)
    }
    update()
    el.addEventListener('scroll', update)
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [])

  return { ref, canScrollUp, canScrollDown }
}
