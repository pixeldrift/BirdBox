import { useId, type CSSProperties } from 'react'

interface GlyphProps {
  className?: string
  style?: CSSProperties
}

interface DirGlyphProps extends GlyphProps {
  dir?: 'left' | 'right'
}

export function ChevronIcon({ dir = 'left', className = '', style }: DirGlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} style={style} aria-hidden="true">
      <path
        d={dir === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'}
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function TriangleGlyph({ dir = 'left', className = '', style }: DirGlyphProps) {
  const id = useId()
  const gradientId = `tri-grad-${id}`
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      style={{ filter: 'drop-shadow(0 2px 1.5px rgba(120,60,10,0.4))', ...style }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0.7" y2="1">
          <stop offset="0%" stopColor="var(--accent-light)" />
          <stop offset="55%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="var(--accent-dark)" />
        </linearGradient>
      </defs>
      <path d={dir === 'left' ? 'M16 4L6 12l10 8V4Z' : 'M8 4l10 8-10 8V4Z'} fill={`url(#${gradientId})`} />
    </svg>
  )
}

export function RecordPencilGlyph({ className = '', style }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} style={style} aria-hidden="true">
      <path d="M3.5 8.5h7.5M3.5 12.5h5.5M3.5 16.5h4" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
      <path
        d="M9.5 20.2l.9-3.9L19.2 7.6a1.5 1.5 0 0 1 2.1 0l.9.9a1.5 1.5 0 0 1 0 2.1L13.4 19.3l-3.9.9Z"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
      <path d="M18.3 9.5l2.1 2.1" stroke="currentColor" strokeWidth={1.7} />
    </svg>
  )
}

export function CheckGlyph({ className = '', style }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} style={style} aria-hidden="true">
      <path d="M5 13l4.5 4.5L19 7" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function XGlyph({ className = '', style }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} style={style} aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
    </svg>
  )
}

export function QuestionGlyph({ className = '', style }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} style={style} aria-hidden="true">
      <path
        d="M9 9a3 3 0 1 1 4.5 2.6c-1 .6-1.5 1.1-1.5 2.4"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="18" r="1.15" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function CrackGlyph({ className = '', style }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} style={style} aria-hidden="true">
      <path
        d="M8 4l3 5-3 2.5 4 3.5-2 5"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function DeadGlyph({ className = '', style }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} style={style} aria-hidden="true">
      <path d="M7 9l3 3m0-3l-3 3M14 9l3 3m0-3l-3 3" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
      <path d="M8.5 16.5c1.2-1 5.8-1 7 0" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
    </svg>
  )
}

export function DownArrowGlyph({ className = '', style }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} style={style} aria-hidden="true">
      <path d="M12 4v14M6 12l6 6 6-6" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function PlusGlyph({ className = '', style }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} style={style} aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
    </svg>
  )
}

export function PencilGlyph({ className = '', style }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} style={style} aria-hidden="true">
      <path
        d="M4 20l.9-3.9L15.6 5.4a1.5 1.5 0 0 1 2.1 0l.9.9a1.5 1.5 0 0 1 0 2.1L7.9 19.1 4 20Z"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <path d="M13.5 7.5l3 3" stroke="currentColor" strokeWidth={1.8} />
    </svg>
  )
}

export function PaletteGlyph({ className = '', style }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} style={style} aria-hidden="true">
      <path
        d="M12 3a9 8.5 0 1 0 0 17c1.1 0 1.7-.9 1.2-1.8-.3-.6-.1-1.3.6-1.5.7-.2 1.4-.2 2.1-.2A4.1 4.1 0 0 0 20 12.5C20 7.3 16.4 3 12 3Z"
        stroke="currentColor"
        strokeWidth={1.7}
      />
      <circle cx="7.6" cy="11" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="10.5" cy="7.3" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="15" cy="8" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="16.6" cy="11.8" r="1.15" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function ChickGlyph({ className = '', style }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} style={style} aria-hidden="true">
      <path d="M9 5l1.5 2M15 5l-1.5 2" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
      <path
        d="M12 7c3.3 0 5.5 2.4 5.5 5.4 0 3-2.3 6.1-5.5 6.1s-5.5-3.1-5.5-6.1C6.5 9.4 8.7 7 12 7Z"
        stroke="currentColor"
        strokeWidth={1.8}
      />
      <circle cx="10.1" cy="11.6" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="13.9" cy="11.6" r="0.9" fill="currentColor" stroke="none" />
      <path d="M11 13.4h2l-1 1.2-1-1.2Z" fill="currentColor" stroke="none" />
    </svg>
  )
}
