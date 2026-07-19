import type { CSSProperties } from 'react'
import chevronDown from '@/icons/chevron-down.svg?raw'
import chevronLeft from '@/icons/chevron-left.svg?raw'
import chevronRight from '@/icons/chevron-right.svg?raw'
import chevronUp from '@/icons/chevron-up.svg?raw'
import chick from '@/icons/chick.svg?raw'
import check from '@/icons/check.svg?raw'
import crack from '@/icons/crack.svg?raw'
import dead from '@/icons/dead.svg?raw'
import downArrow from '@/icons/down-arrow.svg?raw'
import erasePencil from '@/icons/erase-pencil.svg?raw'
import palette from '@/icons/palette.svg?raw'
import pencil from '@/icons/pencil.svg?raw'
import plus from '@/icons/plus.svg?raw'
import question from '@/icons/question.svg?raw'
import recordPencil from '@/icons/record-pencil.svg?raw'
import triangleLeft from '@/icons/triangle-left.svg?raw'
import triangleRight from '@/icons/triangle-right.svg?raw'
import x from '@/icons/x.svg?raw'

interface GlyphProps {
  className?: string
  style?: CSSProperties
}

interface DirGlyphProps extends GlyphProps {
  dir?: 'left' | 'right' | 'up' | 'down'
}

/** Renders a raw .svg file's markup, sized by the wrapper (the file itself
 * carries no width/height, only a viewBox) so callers size icons the same
 * way as before — with a className like "h-5 w-5" — without needing every
 * source file to hardcode a particular pixel size. */
function Svg({ src, className = '', style }: GlyphProps & { src: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block [&>svg]:block [&>svg]:h-full [&>svg]:w-full ${className}`}
      style={style}
      dangerouslySetInnerHTML={{ __html: src }}
    />
  )
}

const CHEVRON_SRC = { left: chevronLeft, right: chevronRight, up: chevronUp, down: chevronDown }

export function ChevronIcon({ dir = 'left', className, style }: DirGlyphProps) {
  return <Svg src={CHEVRON_SRC[dir]} className={className} style={style} />
}

export function TriangleGlyph({ dir = 'left', className, style }: DirGlyphProps) {
  return (
    <Svg
      src={dir === 'left' ? triangleLeft : triangleRight}
      className={className}
      style={{ filter: 'drop-shadow(0 2px 1.5px rgba(120,60,10,0.4))', ...style }}
    />
  )
}

// The "Record" and "Revise" sides of the edit-mode toggle share the same
// pencil-and-notes drawing, just facing opposite ways — but Revise's is a
// dedicated file with the 180° turn baked into its own internal group
// transform, not a CSS transform on this component. A CSS rotate here would
// also rotate whatever drop-shadow filter a caller applies via `style`,
// flipping the shadow upside-down; see erase-pencil.svg.
export function RecordPencilGlyph({ className, style }: GlyphProps) {
  return <Svg src={recordPencil} className={className} style={style} />
}

export function EraseGlyph({ className, style }: GlyphProps) {
  return <Svg src={erasePencil} className={className} style={style} />
}

export function CheckGlyph({ className, style }: GlyphProps) {
  return <Svg src={check} className={className} style={style} />
}

export function XGlyph({ className, style }: GlyphProps) {
  return <Svg src={x} className={className} style={style} />
}

export function QuestionGlyph({ className, style }: GlyphProps) {
  return <Svg src={question} className={className} style={style} />
}

export function CrackGlyph({ className, style }: GlyphProps) {
  return <Svg src={crack} className={className} style={style} />
}

export function DeadGlyph({ className, style }: GlyphProps) {
  return <Svg src={dead} className={className} style={style} />
}

export function DownArrowGlyph({ className, style }: GlyphProps) {
  return <Svg src={downArrow} className={className} style={style} />
}

export function PlusGlyph({ className, style }: GlyphProps) {
  return <Svg src={plus} className={className} style={style} />
}

export function PencilGlyph({ className, style }: GlyphProps) {
  return <Svg src={pencil} className={className} style={style} />
}

export function PaletteGlyph({ className, style }: GlyphProps) {
  return <Svg src={palette} className={className} style={style} />
}

export function ChickGlyph({ className, style }: GlyphProps) {
  return <Svg src={chick} className={className} style={style} />
}
