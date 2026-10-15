'use client'
// Description d'un fichier, éditable en place par le propriétaire seul :
// clic sur la case → saisie, Entrée valide, Échap annule. Les autres membres
// voient le texte. Le contrôle d'accès réel est côté serveur (/api/dataroom/admin).
import { useState, useRef, useEffect } from 'react'

export default function DescCell({ id, initial, editable, lang, placeholder }) {
  const [text, setText] = useState(initial || '')
  const [editing, setEditing] = useState(false)
  const [state, setState] = useState('idle') // idle | saving | error
  const input = useRef(null)
  useEffect(() => { if (editing) input.current?.focus() }, [editing])

  if (!editable) return <span className="dr-desc">{text}</span>

  const save = async (value) => {
    const v = value.trim().slice(0, 300)
    setEditing(false)
    if (v === text) return
    const prev = text
    setText(v)
    setState('saving')
    const r = await fetch('/api/dataroom/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'describe', id, lang, text: v }),
    }).catch(() => null)
    if (r?.ok) setState('idle')
    else { setText(prev); setState('error') }
  }

  if (editing)
    return (
      <input
        ref={input}
        className="dr-desc__input"
        defaultValue={text}
        maxLength={300}
        aria-label={placeholder}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); save(e.currentTarget.value) }
          if (e.key === 'Escape') setEditing(false)
        }}
        onBlur={() => setEditing(false)}
      />
    )

  return (
    <button
      type="button"
      className={`dr-desc dr-desc--edit ${state === 'error' ? 'dr-desc--err' : ''}`}
      onClick={() => setEditing(true)}
      title={placeholder}
    >
      {text || <span className="dr-desc__ph">{placeholder}</span>}
    </button>
  )
}
