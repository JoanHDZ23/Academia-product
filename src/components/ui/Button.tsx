import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Icon } from '../Icon'
import type { IconName } from '../icon-names'
import { cn } from './cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
export type ButtonSize = 'sm' | 'md' | 'lg'
type IconPosition = 'left' | 'right'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: IconName
  iconPosition?: IconPosition
  fullWidth?: boolean
  /** Muestra spinner, aplica `aria-busy` y desactiva el botón. */
  loading?: boolean
}

/**
 * Botón atómico del sistema Klock. Unifica el Button previo añadiendo las
 * variantes `danger`/`success` y el estado `loading`. Estilo por clases CSS.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  loading = false,
  disabled,
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  const iconElement = icon ? <Icon className="button__icon" name={icon} size={18} /> : null

  return (
    <button
      {...props}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'button',
        `button--${variant}`,
        `button--${size}`,
        fullWidth && 'button--full-width',
        className,
      )}
    >
      {loading ? (
        <span className="button__spinner" aria-hidden="true" />
      ) : (
        iconPosition === 'left' ? iconElement : null
      )}
      <span>{children}</span>
      {!loading && iconPosition === 'right' ? iconElement : null}
    </button>
  )
}
