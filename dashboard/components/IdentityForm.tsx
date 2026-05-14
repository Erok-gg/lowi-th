'use client'
import { useState, useImperativeHandle, forwardRef } from 'react'
import { IdentityData, EMPTY_IDENTITY, identityComplete } from '@/lib/identity'

export type IdentityFormRef = {
  getData: () => IdentityData
  isComplete: () => boolean
}

type Props = {
  initialData?: Partial<IdentityData> | null
  onSaved?: (data: IdentityData) => void
  readOnly?: boolean
  showSaveButton?: boolean   // false if parent controls save (e.g. KYC flow)
}

const IdentityForm = forwardRef<IdentityFormRef, Props>(function IdentityForm(
  { initialData, onSaved, readOnly = false, showSaveButton = true },
  ref
) {
  const [data, setData] = useState<IdentityData>({ ...EMPTY_IDENTITY, ...initialData })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // Expose getData + isComplete to parent via ref
  useImperativeHandle(ref, () => ({
    getData: () => data,
    isComplete: () => identityComplete(data),
  }))

  function set(field: keyof IdentityData, value: string) {
    setData(prev => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    const res = await fetch('/api/identity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) {
      setError(json.error ?? 'Erreur lors de la sauvegarde')
    } else {
      setSaved(true)
      onSaved?.(data)
    }
    setSaving(false)
  }

  const field = (
    label: string,
    key: keyof IdentityData,
    type = 'text',
    required = false
  ) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <label className="win-label">
        {label}{required && <span style={{ color: 'var(--win-red)' }}> *</span>}
      </label>
      <input
        type={type}
        className="win-input"
        value={data[key] as string}
        onChange={e => set(key, e.target.value)}
        disabled={readOnly}
        required={required}
      />
    </div>
  )

  return (
    <div>
      {/* Name row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        {field("Prénom", 'first_name', 'text', true)}
        {field("Nom de famille", 'last_name', 'text', true)}
      </div>

      {/* Maiden name + sex */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        {field("Nom d'usage (femmes mariées)", 'maiden_name')}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <label className="win-label">
            Sexe <span style={{ color: 'var(--win-red)' }}>*</span>
          </label>
          <select
            className="win-input"
            value={data.sex}
            onChange={e => set('sex', e.target.value)}
            disabled={readOnly}
            style={{ fontFamily: 'var(--win-font)', fontSize: 12 }}
          >
            <option value="">— Sélectionner —</option>
            <option value="M">Masculin</option>
            <option value="F">Féminin</option>
            <option value="autre">Autre</option>
          </select>
        </div>
      </div>

      {/* Birth row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
        {field("Date de naissance", 'birth_date', 'date', true)}
        {field("Lieu de naissance", 'birth_place', 'text', true)}
        {field("Pays de naissance", 'birth_country', 'text', true)}
      </div>

      {error && (
        <div style={{
          padding: '4px 8px', background: '#ffc0c0',
          border: '1px solid var(--win-red)', fontSize: 12,
          color: 'var(--win-red)', marginBottom: 8,
        }}>
          ⚠ {error}
        </div>
      )}

      {showSaveButton && !readOnly && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
          {saved && (
            <span style={{ fontSize: 11, color: 'var(--win-green)' }}>✓ Sauvegardé</span>
          )}
          <button
            className="win-btn win-btn-primary"
            onClick={handleSave}
            disabled={saving}
            style={{ padding: '3px 16px' }}
          >
            {saving ? '⏳ Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      )}
    </div>
  )
})

export default IdentityForm
