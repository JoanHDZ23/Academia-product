import { Outlet } from 'react-router-dom'

/**
 * Layout mínimo para el modo embebido (dentro de turnos): sin sidebar ni
 * top-bar propios, porque el chrome lo pone la app anfitriona. Solo renderiza
 * el contenido a pantalla completa.
 */
export function EmbedLayout() {
  return (
    <div className="embed-shell">
      <Outlet />
    </div>
  )
}
