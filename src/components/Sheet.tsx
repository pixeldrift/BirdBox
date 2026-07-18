import { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface SheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export function Sheet({ open, onClose, title, children }: SheetProps) {
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="sheet-pop relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border-2 border-orange-400 bg-white dark:bg-neutral-900 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl">
        {title && (
          <h2 className="mb-4 text-center text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>,
    document.body,
  )
}
