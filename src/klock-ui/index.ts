/**
 * SISTEMA KLOCK COMPARTIDO (fuente canónica — espejo de front-turnos)
 * ──────────────────────────────────────────────────────────────────
 * Estos componentes son IDÉNTICOS entre `academia-product` y `front-turnos`.
 * Cada app es un repo/despliegue independiente, así que la consolidación se
 * mantiene como capa canónica sincronizada byte a byte (ver, en front-turnos,
 * `scripts/sync-klock-ui.mjs`: `npm run klock:check` / `klock:sync`).
 *
 * `src/components/*` re-exporta desde aquí para no romper imports existentes.
 * La capa atómica nueva vive en `src/components/ui/`.
 */

export { Button } from '../components/Button'
export type { ButtonProps, ButtonVariant, ButtonSize } from '../components/Button'
export { Modal } from '../components/Modal'
export type { ModalProps } from '../components/Modal'
export { CustomForm } from '../components/CustomForm'
export type { CustomFormProps } from '../components/CustomForm'
export type {
  CustomFormField,
  CustomFormFieldType,
  CustomFormOption,
  CustomFormValues,
} from '../components/custom-form.types'
export { Icon } from '../components/Icon'
export { iconNames } from '../components/icon-names'
export type { IconName } from '../components/icon-names'
