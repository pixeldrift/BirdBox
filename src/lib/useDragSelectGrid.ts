import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'

/**
 * Tap-or-drag selection for a grid of option tiles marked with a
 * `data-select-value` attribute. Pointer down starts tracking; dragging
 * across tiles previews whichever one is under the finger; releasing commits
 * that tile — so a drag works like a more forgiving tap, not just a precise one.
 *
 * Keyboard activation (Enter/Space on a focused tile) is handled separately
 * by the caller via onKeyDown, since it never generates pointer events.
 */
export function useDragSelectGrid(onCommit: (value: string) => void) {
  const [hovered, setHovered] = useState<string | null>(null)
  const draggingRef = useRef(false)
  const onCommitRef = useRef(onCommit)
  onCommitRef.current = onCommit

  function valueAt(x: number, y: number): string | null {
    const el = document.elementFromPoint(x, y) as HTMLElement | null
    return el?.closest<HTMLElement>('[data-select-value]')?.dataset.selectValue ?? null
  }

  useEffect(() => {
    function move(e: PointerEvent) {
      if (!draggingRef.current) return
      setHovered(valueAt(e.clientX, e.clientY))
    }
    function up(e: PointerEvent) {
      if (!draggingRef.current) return
      draggingRef.current = false
      const value = valueAt(e.clientX, e.clientY)
      setHovered(null)
      if (value !== null) onCommitRef.current(value)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [])

  function onPointerDown(e: ReactPointerEvent) {
    draggingRef.current = true
    setHovered(valueAt(e.clientX, e.clientY))
  }

  return { hovered, onPointerDown }
}
