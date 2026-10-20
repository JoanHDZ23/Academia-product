import type { ReactNode } from 'react'
import { useId } from 'react'
import { cn } from './cn'

export type FieldProps = {
  label?: string
  error?: string
  hint?: string
  required?: boolean
  className?: string
  children: (fieldProps: {
    id: string
    'aria-invalid': boolean | undefined
    'aria-describedby': string | undefined
  }) => ReactNode
}

/**
 * Molécula de campo: etiqueta + control (render-prop) + error/hint, con los
 * enlaces de accesibilidad resueltos. Presentación pura (sistema Klock).
 */
export function Field({ label, error, hint, required, className, children }: FieldProps) {
  const id = useId()
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const hasError = Boolean(error)
  const describedBy =
    [hasError ? errorId : undefined, !hasError && hint ? hintId : undefined].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn('ui-field', className)}>
      {label && (
        <label htmlFor={id} className="ui-field__label">
          {label}
          {required && <span className="ui-field__req">*</span>}
        </label>
      )}
      {children({ id, 'aria-invalid': hasError || undefined, 'aria-describedby': describedBy })}
      {hasError ? (
        <p id={errorId} role="alert" className="ui-field__error">{error}</p>
      ) : hint ? (
        <p id={hintId} className="ui-field__hint">{hint}</p>
      ) : null}
    </div>
  )
}
