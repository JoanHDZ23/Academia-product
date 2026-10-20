import { forwardRef, useId, type InputHTMLAttributes } from 'react'
import { cn } from './cn'

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
  hint?: string
}

/** Campo de texto atómico (sistema Klock). Estilo heredado del selector global. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, id, className, 'aria-describedby': ariaDescribedBy, ...rest },
  ref,
) {
  const autoId = useId()
  const fieldId = id ?? autoId
  const errorId = `${fieldId}-error`
  const hintId = `${fieldId}-hint`
  const hasError = Boolean(error)
  const describedBy =
    [ariaDescribedBy, hasError ? errorId : undefined, !hasError && hint ? hintId : undefined]
      .filter(Boolean).join(' ') || undefined

  return (
    <div className="ui-field">
      {label && <label htmlFor={fieldId} className="ui-field__label">{label}</label>}
      <input
        ref={ref}
        id={fieldId}
        aria-invalid={hasError || undefined}
        aria-describedby={describedBy}
        className={cn(hasError && 'ui-control--invalid', className)}
        {...rest}
      />
      {hasError ? (
        <p id={errorId} role="alert" className="ui-field__error">{error}</p>
      ) : hint ? (
        <p id={hintId} className="ui-field__hint">{hint}</p>
      ) : null}
    </div>
  )
})
