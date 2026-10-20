import { forwardRef, useId, type TextareaHTMLAttributes } from 'react'
import { cn } from './cn'

export type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string
  error?: string
  hint?: string
}

/** Área de texto atómica (sistema Klock). */
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, error, hint, id, className, rows = 3, 'aria-describedby': ariaDescribedBy, ...rest },
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
      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        aria-invalid={hasError || undefined}
        aria-describedby={describedBy}
        className={cn('custom-form__control--textarea', hasError && 'ui-control--invalid', className)}
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
