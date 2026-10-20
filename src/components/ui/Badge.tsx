import type { ReactNode } from 'react'
import { cn } from './cn'

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'

export type BadgeProps = {
  tone?: BadgeTone
  icon?: ReactNode
  children: ReactNode
  className?: string
}

/** Etiqueta de estado atómica (sistema Klock). */
export function Badge({ tone = 'neutral', icon, children, className }: BadgeProps) {
  return (
    <span className={cn('ui-badge', `ui-badge--${tone}`, className)}>
      {icon}
      {children}
    </span>
  )
}
