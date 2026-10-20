import { useState } from 'react'
import { Boxes, Plus, Trash2, Eye, EyeOff, Puzzle, Play } from 'lucide-react'
import { Button, Input, Badge } from './ui'
import { DynamicMicrofrontend } from './DynamicMicrofrontend'
import {
  getMfes, addMfe, removeMfe, toggleMfe, validateMfe, type MfeEntry,
} from '../lib/mfe-registry'

/**
 * Sección de /root-panel para integrar microfrontends dinámicos.
 * Se agregan proporcionando la URL del .js y el tag del Web Component, sin
 * recompilar el Host. Permite activar/desactivar, eliminar y previsualizar.
 */
export function MicrofrontendsSection() {
  const [list, setList] = useState<MfeEntry[]>(() => getMfes())
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [tag, setTag] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<MfeEntry | null>(null)

  const refresh = () => setList(getMfes())

  const handleAdd = () => {
    const err = validateMfe({ name, url, tag })
    if (err) { setError(err); return }
    addMfe({ name, url, tag })
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
            Integra módulos externos por URL, sin recompilar. Se cargan como Web Components aislados.
          </p>
        </div>
      </header>

      {/* Formulario para agregar un MFE */}
      <div style={{ display: 'grid', gap: '.6rem', gridTemplateColumns: '1fr', maxWidth: 560 }}>
        <Input label="Nombre" placeholder="Ej: Ventas" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="URL del bundle (.js)" placeholder="https://cdn.ejemplo.com/mfe-ventas.js" value={url} onChange={(e) => setUrl(e.target.value)} />
        <Input label="Tag del Web Component" placeholder="mfe-ventas" value={tag} onChange={(e) => setTag(e.target.value.toLowerCase())}
          hint="Debe ser un Custom Element válido con guion (ej. mfe-ventas)." error={error ?? undefined} />
        <div>
          <Button variant="primary" onClick={handleAdd}>
            <Plus size={16} style={{ marginRight: '.35rem' }} /> Agregar microfrontend
          </Button>
        </div>
      </div>

      {/* Listado de MFEs */}
      <div style={{ marginTop: '1.25rem', display: 'grid', gap: '.6rem' }}>
        {list.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', color: 'var(--klock-text-3)', fontSize: 'var(--klock-sm)' }}>
            <Puzzle size={16} /> Aún no hay microfrontends. Agrega uno arriba.
          </div>
        ) : (
          list.map((m) => (
            <div key={m.id} style={{
              display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.75rem .9rem',
              border: '1px solid var(--klock-border)', borderRadius: 'var(--klock-radius)',
              background: 'var(--klock-surface)',
            }}>
              <Puzzle size={18} color="var(--klock-primary-500)" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                  <strong style={{ color: 'var(--klock-text)' }}>{m.name}</strong>
                  <Badge tone={m.enabled ? 'success' : 'neutral'}>{m.enabled ? 'Activo' : 'Inactivo'}</Badge>
                  <code style={{ fontSize: 'var(--klock-xs)', color: 'var(--klock-text-3)' }}>&lt;{m.tag}&gt;</code>
                </div>
                <div style={{ fontSize: 'var(--klock-xs)', color: 'var(--klock-text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.url}</div>
              </div>
              <button type="button" className="icon-btn" title={m.enabled ? 'Desactivar' : 'Activar'}
                onClick={() => { toggleMfe(m.id); refresh() }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--klock-text-3)' }}>
                {m.enabled ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
              <button type="button" title="Previsualizar" disabled={!m.enabled}
                onClick={() => setPreview(m)}
                style={{ background: 'none', border: 'none', cursor: m.enabled ? 'pointer' : 'not-allowed', color: m.enabled ? 'var(--klock-primary-500)' : 'var(--klock-text-4)' }}>
                <Play size={18} />
              </button>
              <button type="button" title="Eliminar"
                onClick={() => { removeMfe(m.id); if (preview?.id === m.id) setPreview(null); refresh() }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--klock-danger)' }}>
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Previsualización en vivo del MFE seleccionado */}
      {preview && (
        <div style={{ marginTop: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.5rem' }}>
            <h4 style={{ margin: 0 }}>Vista previa · {preview.name}</h4>
            <Button variant="secondary" size="sm" onClick={() => setPreview(null)}>Cerrar</Button>
          </div>
          <div style={{ border: '1px solid var(--klock-border)', borderRadius: 'var(--klock-radius)', overflow: 'hidden' }}>
            <DynamicMicrofrontend
              scriptUrl={preview.url}
              tagName={preview.tag}
              props={{ host: 'academia' }}
              events={{ 'mfe:event': (detail) => console.info('[MFE event]', preview.tag, detail) }}
              style={{ minHeight: 160 }}
            />
          </div>
        </div>
      )}
    </section>
  )
}
