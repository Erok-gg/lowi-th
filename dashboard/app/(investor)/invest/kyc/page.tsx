'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import IdentityForm, { IdentityFormRef } from '@/components/IdentityForm'
import { IdentityData, identityComplete } from '@/lib/identity'

const PRICE_PER_PART = 100_000
const MIN_PARTS = 5
const TOTAL_PARTS = 73

type Rates = { usd_to_thb: number; eur_to_thb: number; updated_at: string | null; source: string }

function fmt(n: number, currency: string) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)
}

export default function InvestKycPage() {
  const router = useRouter()

  // Step 1 — Parts
  const [parts, setParts]             = useState(MIN_PARTS)
  const [rates, setRates]             = useState<Rates | null>(null)
  const [available, setAvailable]     = useState(TOTAL_PARTS)
  const [partsConfirmed, setPartsConfirmed] = useState(false)
  const [reserving, setReserving]     = useState(false)
  const [reservationId, setReservationId] = useState<string | null>(null)

  // Step 2 — Identity
  const [identity, setIdentity]       = useState<Partial<IdentityData> | null>(null)
  const [identityOk, setIdentityOk]   = useState(false)
  const identityRef = useRef<IdentityFormRef>(null)

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [error, setError] = useState('')

  useEffect(() => {
    // Fetch exchange rates
    fetch('/api/invest/exchange-rate').then(r => r.json()).then(setRates)

    // Fetch availability
    fetch('/api/invest/availability').then(r => r.json()).then(d => {
      if (d.available !== undefined) setAvailable(d.available)
    }).catch(() => {})

    // Pre-fill identity if exists
    fetch('/api/identity').then(r => r.json()).then(d => {
      if (d.identity) {
        setIdentity(d.identity)
        setIdentityOk(identityComplete(d.identity as IdentityData))
      }
    })
  }, [])

  const total_thb = parts * PRICE_PER_PART
  const total_usd = rates ? total_thb / rates.usd_to_thb : null
  const total_eur = rates ? total_thb / rates.eur_to_thb : null

  async function handleConfirmParts() {
    setReserving(true)
    setError('')
    const res = await fetch('/api/invest/reserve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parts_count: parts,
        usd_rate: rates?.usd_to_thb,
        eur_rate: rates?.eur_to_thb,
      }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Erreur'); setReserving(false); return }
    setReservationId(data.reservation_id)
    setPartsConfirmed(true)
    setStep(2)
    setReserving(false)
  }

  async function handleConfirmIdentity() {
    // Save identity first
    const ref = identityRef.current
    if (!ref?.isComplete()) { setError('Veuillez compléter toutes les informations obligatoires.'); return }
    setError('')
    const res = await fetch('/api/identity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ref.getData()),
    })
    if (!res.ok) { setError('Erreur sauvegarde identité'); return }
    setStep(3)
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 16px' }}>

      {/* Progress bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 32, alignItems: 'center' }}>
        {([
          { n: 1, label: 'Réservation' },
          { n: 2, label: 'Identité' },
          { n: 3, label: 'Documents KYC' },
        ] as const).map(({ n, label }, i) => (
          <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
            <div className="inv-step-badge" style={{
              background: step >= n ? 'var(--inv-navy)' : 'var(--inv-gray-dk)',
              color: step >= n ? 'var(--inv-white)' : 'var(--inv-muted)',
            }}>{n}</div>
            <span style={{ fontSize: 13, color: step >= n ? 'var(--inv-navy)' : 'var(--inv-muted)', fontWeight: step === n ? 600 : 400 }}>
              {label}
            </span>
            {i < 2 && <div style={{ flex: 1, height: 1, background: step > n ? 'var(--inv-navy)' : 'var(--inv-border)' }} />}
          </div>
        ))}
      </div>

      {error && (
        <div style={{
          padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca',
          borderRadius: 'var(--inv-radius)', fontSize: 13, color: 'var(--inv-red)', marginBottom: 16,
        }}>
          ⚠ {error}
        </div>
      )}

      {/* ── STEP 1 : Réservation ── */}
      {step === 1 && (
        <div className="inv-card" style={{ padding: 28 }}>
          {/* Property header */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 24 }}>
            <div style={{
              width: 56, height: 56, background: 'var(--inv-navy)',
              borderRadius: 'var(--inv-radius)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, flexShrink: 0,
            }}>🏝</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--inv-navy)', marginBottom: 2 }}>
                Chalok Baan Kao Pool Villa
              </div>
              <div style={{ fontSize: 13, color: 'var(--inv-muted)' }}>
                Koh Tao, Thaïlande · Bail 20 ans · Rendement cible 7,5% / an
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                <span style={{ fontSize: 12, background: 'var(--inv-gray)', padding: '2px 8px', borderRadius: 20, color: 'var(--inv-navy)' }}>
                  100 000 THB / part
                </span>
                <span style={{ fontSize: 12, background: '#fef9f0', padding: '2px 8px', borderRadius: 20, color: '#92400e' }}>
                  {available} parts disponibles / {TOTAL_PARTS}
                </span>
              </div>
            </div>
          </div>

          <hr className="inv-divider" />

          {/* Parts selector */}
          <div style={{ marginBottom: 20 }}>
            <label className="inv-label" style={{ marginBottom: 8 }}>
              Nombre de parts <span style={{ color: 'var(--inv-muted)', fontWeight: 400 }}>(minimum {MIN_PARTS})</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                className="inv-btn inv-btn-outline"
                style={{ width: 40, height: 40, padding: 0, minWidth: 0, borderRadius: '50%', fontSize: 18 }}
                onClick={() => setParts(p => Math.max(MIN_PARTS, p - 1))}
                disabled={parts <= MIN_PARTS}
              >−</button>
              <input
                type="number"
                className="inv-input"
                value={parts}
                min={MIN_PARTS}
                max={available}
                onChange={e => setParts(Math.min(available, Math.max(MIN_PARTS, parseInt(e.target.value) || MIN_PARTS)))}
                style={{ textAlign: 'center', fontSize: 22, fontWeight: 700, maxWidth: 100 }}
              />
              <button
                className="inv-btn inv-btn-outline"
                style={{ width: 40, height: 40, padding: 0, minWidth: 0, borderRadius: '50%', fontSize: 18 }}
                onClick={() => setParts(p => Math.min(available, p + 1))}
                disabled={parts >= available}
              >+</button>
              <span style={{ fontSize: 13, color: 'var(--inv-muted)' }}>parts</span>
            </div>
          </div>

          {/* Value display */}
          <div style={{
            background: 'var(--inv-gray)',
            borderRadius: 'var(--inv-radius)',
            padding: '16px 20px',
            marginBottom: 24,
          }}>
            <div style={{ fontSize: 13, color: 'var(--inv-muted)', marginBottom: 8 }}>Valeur de votre investissement</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--inv-navy)', marginBottom: 4 }}>
              {fmt(total_thb, 'THB')}
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 14, color: 'var(--inv-muted)' }}>
              {total_usd !== null && (
                <span>≈ {fmt(total_usd, 'USD')}</span>
              )}
              {total_eur !== null && (
                <span>≈ {fmt(total_eur, 'EUR')}</span>
              )}
              {!rates && <span style={{ fontSize: 12 }}>Chargement des taux...</span>}
            </div>
            {rates && (
              <div style={{ fontSize: 11, color: 'var(--inv-muted)', marginTop: 6, borderTop: '1px solid var(--inv-border)', paddingTop: 6 }}>
                Taux interbancaires · 1 USD = {rates.usd_to_thb.toFixed(2)} THB · 1 EUR = {rates.eur_to_thb.toFixed(2)} THB
                {rates.updated_at && <span> · Mis à jour {new Date(rates.updated_at).toLocaleDateString('fr-FR')}</span>}
              </div>
            )}
          </div>

          <div style={{ fontSize: 12, color: 'var(--inv-muted)', marginBottom: 16 }}>
            ⚠ Cette réservation n&apos;est pas définitive. Notre équipe vous contactera sous 24h ouvrées pour finaliser votre investissement.
          </div>

          <button
            className="inv-btn inv-btn-gold"
            style={{ width: '100%', padding: 14, fontSize: 15 }}
            disabled={reserving}
            onClick={handleConfirmParts}
          >
            {reserving ? '⏳ Réservation...' : `Réserver ${parts} parts pour ${fmt(total_thb, 'THB')} →`}
          </button>
        </div>
      )}

      {/* ── STEP 2 : Identité ── */}
      {step === 2 && (
        <div className="inv-card" style={{ padding: 28 }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--inv-navy)', marginBottom: 4 }}>
              Informations personnelles
            </div>
            <div style={{ fontSize: 13, color: 'var(--inv-muted)' }}>
              Ces informations sont requises pour votre dossier KYC.
              {identityOk && ' Nous avons pré-rempli les champs depuis votre profil.'}
            </div>
          </div>

          <IdentityForm
            ref={identityRef}
            initialData={identity}
            showSaveButton={false}
            onSaved={(d) => setIdentityOk(identityComplete(d))}
          />

          <hr className="inv-divider" />

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button className="inv-btn inv-btn-outline" onClick={() => setStep(1)}>
              ← Retour
            </button>
            <button
              className="inv-btn inv-btn-gold"
              style={{ padding: '10px 32px' }}
              onClick={handleConfirmIdentity}
            >
              Continuer →
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3 : Documents KYC ── */}
      {step === 3 && (
        <div className="inv-card" style={{ padding: 28 }}>
          <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--inv-navy)', marginBottom: 8 }}>
            Documents KYC
          </div>
          <div style={{ fontSize: 13, color: 'var(--inv-muted)', marginBottom: 24 }}>
            Pour finaliser votre investissement, nous devons vérifier votre identité conformément à la réglementation (AML/KYC).
          </div>

          {/* Summary */}
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 'var(--inv-radius)',
            padding: '12px 16px',
            marginBottom: 20,
            fontSize: 13,
          }}>
            <div style={{ fontWeight: 600, color: 'var(--inv-green)', marginBottom: 4 }}>
              ✓ Réservation #{reservationId?.slice(0, 8).toUpperCase()} enregistrée
            </div>
            <div style={{ color: 'var(--inv-muted)' }}>
              {parts} parts · {fmt(total_thb, 'THB')}
              {total_eur !== null && ` (≈ ${fmt(total_eur, 'EUR')})`}
            </div>
          </div>

          {/* Documents list */}
          {[
            { icon: '🪪', label: "Pièce d'identité (recto + verso)", desc: "Passeport ou carte nationale en cours de validité" },
            { icon: '🏠', label: 'Justificatif de domicile', desc: "Facture ou relevé bancaire < 3 mois" },
            { icon: '📸', label: "Selfie avec pièce d'identité", desc: "Photo nette, document visible" },
            { icon: '💰', label: "Justificatif d'origine des fonds", desc: "Relevé bancaire, contrat de vente, etc." },
          ].map(doc => (
            <div key={doc.label} style={{
              display: 'flex', gap: 12, alignItems: 'flex-start',
              padding: '10px 0', borderBottom: '1px solid var(--inv-border)',
            }}>
              <span style={{ fontSize: 20 }}>{doc.icon}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{doc.label}</div>
                <div style={{ fontSize: 12, color: 'var(--inv-muted)' }}>{doc.desc}</div>
              </div>
            </div>
          ))}

          <div style={{ marginTop: 20, fontSize: 13, color: 'var(--inv-muted)', marginBottom: 20 }}>
            📋 Formats acceptés : PDF, JPG, PNG · Max 10 MB par fichier
          </div>

          <button
            className="inv-btn inv-btn-gold"
            style={{ width: '100%', padding: 14, fontSize: 15 }}
            onClick={() => router.push('/kyc')}
          >
            Accéder à l&apos;upload des documents →
          </button>

          <div style={{ marginTop: 12, textAlign: 'center', fontSize: 12, color: 'var(--inv-muted)' }}>
            Vous pouvez compléter les documents plus tard depuis votre espace « Mon KYC »
          </div>
        </div>
      )}
    </div>
  )
}
