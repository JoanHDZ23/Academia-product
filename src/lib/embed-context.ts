/**
 * Contexto de incrustación (embed): cuando Academia se abre dentro de un iframe
 * del producto de turnos, recibe el contexto de la sesión por querystring
 * (companyId, user, role, companyName) y NO muestra pantalla de login.
 *
 * Lee los parámetros en el primer load y los persiste en sessionStorage para
 * que sobrevivan a los cambios de ruta dentro de la app.
 */

let _companyId = ''
let _user = ''
let _role = ''
let _companyName = ''
let _embed = false
let _initialized = false

function init() {
  if (_initialized) return
  _initialized = true

  const params = new URLSearchParams(window.location.search)
  _companyId = params.get('companyId') ?? ''
  _user = params.get('user') ?? ''
  _role = params.get('role') ?? ''
  _companyName = params.get('companyName') ?? ''
  _embed = params.get('embed') === '1' || Boolean(_companyId)

  if (_companyId) {
    sessionStorage.setItem('ommex_academia_embed_companyId', _companyId)
    sessionStorage.setItem('ommex_academia_embed_user', _user)
    sessionStorage.setItem('ommex_academia_embed_role', _role)
    sessionStorage.setItem('ommex_academia_embed_companyName', _companyName)
    sessionStorage.setItem('ommex_academia_embed', '1')
  } else {
    _companyId = sessionStorage.getItem('ommex_academia_embed_companyId') ?? ''
    _user = sessionStorage.getItem('ommex_academia_embed_user') ?? ''
    _role = sessionStorage.getItem('ommex_academia_embed_role') ?? ''
    _companyName = sessionStorage.getItem('ommex_academia_embed_companyName') ?? ''
    _embed = sessionStorage.getItem('ommex_academia_embed') === '1'
  }
}

export function isEmbedded(): boolean {
  init()
  return _embed
}
export function getEmbedCompanyId(): string {
  init()
  return _companyId
}
export function getEmbedUser(): string {
  init()
  return _user
}
export function getEmbedRole(): string {
  init()
  return _role
}
export function getEmbedCompanyName(): string {
  init()
  return _companyName
}
