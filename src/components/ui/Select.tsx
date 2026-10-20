import { forwardRef, useId, type SelectHTMLAttributes, type ReactNode } from 'react'
import { cn } from './cn'

export type SelectOption = { label: string; value: string; disabled?: boolean }

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  error?: string
  hint?: string
  options?: SelectOption[]
  placeholder?: string
  children?: ReactNode
}

/** Selector atómico (sistema Klock). Acepta `options` o `<option>` como children. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, options, placeholder, id, className, children, 'aria-describedby': ariaDescribedBy, ...rest },
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
      <select
        ref={ref}
        id={fieldId}
        aria-invalid={hasError || undefined}
        aria-describedby={describedBy}
        className={cn(hasError && 'ui-control--invalid', className)}
        {...rest}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options
          ? options.map((o) => <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>)
          : children}
      </select>
      {hasError ? (
        <p id={errorId} role="alert" className="ui-field__error">{error}</p>
      ) : hint ? (
        <p id={hintId} className="ui-field__hint">{hint}</p>
      ) : null}
    </div>
  )
})
