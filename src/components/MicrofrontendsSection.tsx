import { useEffect, useState } from 'react'
import { Boxes, Plus, Trash2, Eye, EyeOff, Puzzle, Play, Settings } from 'lucide-react'
import { Button, Input, Select, Checkbox, Badge } from './ui'
import { Modal } from './Modal'
import { DynamicMicrofrontend } from './DynamicMicrofrontend'
import {
  getMfes, addMfe, removeMfe, toggleMfe, validateMfe, setMfeConfig, getMfeConfig,
  loadMfesFromServer, saveMfesToServer,
  type MfeEntry, type MfeType, type MfeConfigValues,
} from '../lib/mfe-registry'

interface Props {
  /** Compañías disponibles para configurar el MFE (id + nombre). */
  companies?: Array<{ id: string; nombre: string }>
  /** Token root para persistir el registro en el backend del Host. */
  token?: string | null
}

/**
 * Sección de /root-panel para integrar y configurar microfrontends.
 * - Agrega módulos externos (iframe o web component) por URL, sin recompilar.
 * - Trazabilidad y academia aparecen como MFE integrados (removibles).
 * - Cada MFE define opciones de configuración editables POR COMPAÑÍA.
 */
export function MicrofrontendsSection({ companies = [], token }: Props) {
  const [list, setList] = useState<MfeEntry[]>(() => getMfes())
  const [type, setType] = useState<MfeType>('iframe')
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [tag, setTag] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<MfeEntry | null>(null)
  const [configTarget, setConfigTarget] = useState<MfeEntry | null>(null)

  // Carga el registro desde el backend del Host al montar (compartido entre usuarios).
  useEffect(() => {
    if (!token) return
    void loadMfesFromServer(token).then(() => setList(getMfes()))
  }, [token])

  // Refresca la lista local y persiste en el backend tras cada cambio.
  const refresh = () => {
    setList(getMfes())
    if (token) void saveMfesToServer(token)
  }

  const handleAdd = () => {
    const err = validateMfe({ name, type, url, tag })
    if (err) { setError(err); return }
    addMfe({ name, type, url, tag })
    setName(''); setUrl(''); setTag(''); setError(null)
    refresh()
  }

  return (
    <section className="content-panel" style={{ marginTop: '1.25rem' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.75rem' }}>
        <Boxes size={20} color="var(--klock-primary)" />
        <div>
          <h3 style={{ margin: 0 }}>Microfrontends</h3>
          <p style={{ margin: 0, fontSize: 'var(--klock-sm)', color: 'var(--klock-text-3)' }}>
            Integra módulos externos (iframe o Web Component) por URL, sin recompilar. Configúralos por compañía.
          </p>
        </div>
      </header>

      {/* Formulario para agregar un MFE */}
      <div style={{ display: 'grid', gap: '.6rem', gridTemplateColumns: '1fr', maxWidth: 560 }}>
        <Select label="Tipo de integración" value={type} onChange={(e) => setType(e.target.value as MfeType)}
          options={[{ label: 'App embebida (iframe)', value: 'iframe' }, { label: 'Web Component (.js)', value: 'webcomponent' }]} />
        <Input label="Nombre" placeholder="Ej: Ventas" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label={type === 'iframe' ? 'URL de la app' : 'URL del bundle (.js)'}
          placeholder={type === 'iframe' ? 'https://mi-modulo.vercel.app' : 'https://cdn.ejemplo.com/mfe-ventas.js'}
          value={url} onChange={(e) => setUrl(e.target.value)}
          error={type === 'webcomponent' ? undefined : (error ?? undefined)} />
        {type === 'webcomponent' && (
          <Input label="Tag del Web Component" placeholder="mfe-ventas" value={tag}
            onChange={(e) => setTag(e.target.value.toLowerCase())}
            hint="Custom Element válido con guion (ej. mfe-ventas)." error={error ?? undefined} />
        )}
        <div>
          <Button variant="primary" onClick={handleAdd}>
            <Plus size={16} style={{ marginRight: '.35rem' }} /> Agregar microfrontend
          </Button>
        </div>
      </div>

      {/* Listado de MFEs */}
      <div style={{ marginTop: '1.25rem', display: 'grid', gap: '.6rem' }}>
        {list.map((m) => (
          <div key={m.id} style={{
            display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.75rem .9rem',
            border: '1px solid var(--klock-border)', borderRadius: 'var(--klock-radius)',
            background: 'var(--klock-surface)', opacity: m.enabled ? 1 : .6,
          }}>
            <Puzzle size={18} color="var(--klock-primary-500)" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap' }}>
                <strong style={{ color: 'var(--klock-text)' }}>{m.name}</strong>
                <Badge tone={m.type === 'iframe' ? 'info' : 'primary'}>{m.type === 'iframe' ? 'iframe' : 'web component'}</Badge>
                {m.builtin && <Badge tone="neutral">integrado</Badge>}
                <Badge tone={m.enabled ? 'success' : 'neutral'}>{m.enabled ? 'Activo' : 'Inactivo'}</Badge>
              </div>
              <div style={{ fontSize: 'var(--klock-xs)', color: 'var(--klock-text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.url}</div>
            </div>
            {m.configSchema.length > 0 && (
              <button type="button" title="Configurar por compañía" onClick={() => setConfigTarget(m)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--klock-text-2)' }}>
                <Settings size={18} />
              </button>
            )}
            <button type="button" title={m.enabled ? 'Desactivar' : 'Activar'} onClick={() => { toggleMfe(m.id); refresh() }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--klock-text-3)' }}>
              {m.enabled ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
            <button type="button" title="Previsualizar" disabled={!m.enabled} onClick={() => setPreview(m)}
              style={{ background: 'none', border: 'none', cursor: m.enabled ? 'pointer' : 'not-allowed', color: m.enabled ? 'var(--klock-primary-500)' : 'var(--klock-text-4)' }}>
              <Play size={18} />
            </button>
            <button type="button" title={m.builtin ? 'Desactivar (integrado)' : 'Eliminar'}
              onClick={() => { removeMfe(m.id); if (preview?.id === m.id) setPreview(null); refresh() }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--klock-danger)' }}>
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      {/* Previsualización en vivo */}
      {preview && (
        <div style={{ marginTop: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.5rem' }}>
            <h4 style={{ margin: 0 }}>Vista previa · {preview.name}</h4>
            <Button variant="secondary" size="sm" onClick={() => setPreview(null)}>Cerrar</Button>
          </div>
          <div style={{ border: '1px solid var(--klock-border)', borderRadius: 'var(--klock-radius)', overflow: 'hidden' }}>
            <DynamicMicrofrontend
              type={preview.type}
              scriptUrl={preview.url}
              tagName={preview.tag}
              props={{ host: 'academia' }}
              events={{ 'mfe:event': (detail) => console.info('[MFE event]', preview.name, detail) }}
              style={{ minHeight: 320 }}
            />
          </div>
        </div>
      )}

      {/* Modal de configuración por compañía */}
      {configTarget && (
        <MfeConfigModal
          mfe={configTarget}
          companies={companies}
          onClose={() => setConfigTarget(null)}
          onSaved={() => { setConfigTarget(null); refresh() }}
        />
      )}
    </section>
  )
}

// ── Modal: configurar un MFE para una compañía concreta ─────────────────────
function MfeConfigModal({ mfe, companies, onClose, onSaved }: {
  mfe: MfeEntry
  companies: Array<{ id: string; nombre: string }>
  onClose: () => void
  onSaved: () => void
}) {
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? '')
  const [values, setValues] = useState<MfeConfigValues>(() => (companyId ? getMfeConfig(mfe, companyId) : {}))

  const onCompanyChange = (id: string) => {
    setCompanyId(id)
    setValues(getMfeConfig(mfe, id))
  }
  const setField = (key: string, value: string | number | boolean) =>
    setValues((v) => ({ ...v, [key]: value }))

  const save = () => {
    if (!companyId) return
    setMfeConfig(mfe.id, companyId, values)
    onSaved()
  }

  return (
    <Modal open title={`Configurar · ${mfe.name}`} onClose={onClose}>
      <div style={{ display: 'grid', gap: '.75rem' }}>
        <Select label="Compañía" value={companyId} onChange={(e) => onCompanyChange(e.target.value)}
          placeholder={companies.length ? undefined : 'No hay compañías'}
          options={companies.map((c) => ({ label: c.nombre, value: c.id }))} />

        {companyId ? (
          mfe.configSchema.map((f) => {
            if (f.type === 'boolean') {
              return (
                <Checkbox key={f.key} label={f.label} hint={f.hint}
                  checked={Boolean(values[f.key])}
                  onChange={(e) => setField(f.key, e.target.checked)} />
              )
            }
            if (f.type === 'select') {
              return (
                <Select key={f.key} label={f.label} hint={f.hint}
                  value={String(values[f.key] ?? '')}
                  onChange={(e) => setField(f.key, e.target.value)}
                  options={f.options ?? []} />
              )
            }
            return (
              <Input key={f.key} label={f.label} hint={f.hint}
                type={f.type === 'number' ? 'number' : 'text'}
                value={String(values[f.key] ?? '')}
                onChange={(e) => setField(f.key, f.type === 'number' ? Number(e.target.value) : e.target.value)} />
            )
          })
        ) : (
          <p style={{ fontSize: 'var(--klock-sm)', color: 'var(--klock-text-3)' }}>Selecciona una compañía para configurar.</p>
        )}

        <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end', paddingTop: '.5rem' }}>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={save} disabled={!companyId}>Guardar configuración</Button>
        </div>
      </div>
    </Modal>
  )
}
