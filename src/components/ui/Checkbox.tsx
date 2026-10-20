import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from './cn'

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label?: ReactNode
  hint?: string
}

/** Checkbox atómico (sistema Klock). Toda la fila es un `<label>` clicable. */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, hint, id, className, ...rest },
  ref,
) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <label htmlFor={fieldId} className="ui-checkbox">
      <input ref={ref} id={fieldId} type="checkbox" className={cn(className)} {...rest} />
      {(label || hint) && (
        <span>
          {label && <span className="ui-checkbox__label">{label}</span>}
          {hint && <span className="ui-checkbox__hint">{hint}</span>}
        </span>
      )}
    </label>
  )
})
