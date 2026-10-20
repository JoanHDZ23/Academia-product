/**
 * Une clases de forma segura, descartando valores vacíos/falsy.
 * Alternativa mínima a `clsx` para no agregar dependencias.
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}
