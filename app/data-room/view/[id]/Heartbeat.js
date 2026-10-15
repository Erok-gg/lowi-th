'use client'
// Temps de lecture : un battement toutes les 15 s, seulement onglet visible.
import { useEffect } from 'react'

export default function Heartbeat({ fileId }) {
  useEffect(() => {
    const beat = () => {
      if (document.visibilityState !== 'visible') return
      fetch('/api/dataroom/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId }),
        keepalive: true,
      }).catch(() => {})
    }
    const id = setInterval(beat, 15000)
    return () => clearInterval(id)
  }, [fileId])
  return null
}
