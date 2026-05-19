'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/app/(public)/_components/LangContext'

// ── Constantes (alignées avec lib/validation.ts) ─────────────────────────────
const POOL_TYPES = ['', 'private', 'shared', 'none'] as const
type PoolKey = typeof POOL_TYPES[number]
const TYPE_KEYS = ['villa', 'condo', 'hotel', 'bungalow', 'eco-resort', 'co-living', 'boutique-hotel', 'land', 'other'] as const
type TypeKey = typeof TYPE_KEYS[number]
const COUNTRY_KEYS = ['TH', 'FR', 'PT', 'ES', 'MA', 'OTHER'] as const
type CountryKey = typeof COUNTRY_KEYS[number]

// ── i18n ─────────────────────────────────────────────────────────────────────
const I18N = {
  fr: {
    loading: 'Chargement…',
    back: '← Mon profil',
    title: 'Proposer un bien',
    intro: 'Décrivez votre propriété en détail. Plus d\'infos = examen plus rapide. Les champs marqués',
    introSuffix: 'sont obligatoires.',
    emailUnverifiedTitle: 'Vérifiez votre email avant de soumettre',
    emailUnverifiedBody: (e: string) => <>Vous devez confirmer <strong>{e}</strong> avant de pouvoir lister un bien.</>,
    emailSentOk: '✓ Email renvoyé. Consultez votre boîte.',
    resendBtn: 'Renvoyer l\'email de vérification',
    resending: 'Envoi…',
    resendIn: (s: number) => `Renvoyer dans ${s}s`,
    kybInfoTitle: 'ℹ️ Documents requis à l\'acceptation',
    kybInfoBody: 'Si votre bien est sélectionné, nous vous demanderons : passeport du porteur, titre de propriété, extrait Kbis (DBD <3 mois) et acte de nomination du directeur.',
    // sections
    sIdentity: '🏷️ Identité',
    sValue: '📊 Valeur & surface',
    sDescription: '🏡 Description',
    sChars: '📐 Caractéristiques étendues',
    sSituation: '📍 Situation',
    sAmenities: '✅ Équipements',
    sLease: '⚖️ Bail & structure juridique',
    sContact: '✉️ Contact',
    optional: 'Optionnel',
    hintChars: 'Plus de détails physiques aident l\'examen.',
    hintSituation: 'Accès, points d\'intérêt, distances.',
    hintAmenities: 'Max 50 équipements · 80 caractères chacun.',
    hintLease: 'Si vous ne connaissez pas ces infos, laissez vide — LOWI complètera.',
    // fields
    fTitle: 'Nom du bien',
    fType: 'Type', fCountry: 'Pays', fCity: 'Ville / Zone',
    selectPh: 'Sélectionnez…',
    fValue: 'Valeur estimée (THB)', fSurface: 'Surface (m²)', fBedrooms: 'Chambres',
    fDescription: 'Description du bien',
    fDescPh: 'Présentation du bien, son histoire, atouts locatifs, particularités…',
    fDescCount: (n: number) => `${n} / 4000 · minimum 20 caractères`,
    fBathrooms: 'Salles de bain', fPool: 'Piscine', fView: 'Vue',
    fBeach: 'Accès plage', fAirport: 'Aéroport', fHospital: 'Hôpital',
    amenityPh: 'WiFi fibre, Piscine à débordement, Climatisation…',
    amenityAdd: '+ Ajouter',
    amenityNone: 'Aucun ajouté',
    fLeaseYears: 'Durée bail (années)', fLeaseRemaining: 'Restant (années)', fLeaseExpiry: 'Année d\'expiration',
    fLeaseType: 'Type de bail', fTrustee: 'Trustee', fArbitration: 'Clause d\'arbitrage',
    fLegalNote: 'Note juridique complémentaire',
    fLegalNotePh: 'Tout élément juridique pertinent (titre clean, sans hypothèque, etc.)',
    fContactEmail: 'Email de contact',
    contactHint: (curr: string) => `Cet email est utilisé pour les communications relatives à votre bien. Peut différer de votre email de compte (${curr || '—'}).`,
    errEmailNotVerified: 'Vérifiez d\'abord votre email avant de soumettre.',
    submitBtn: 'Soumettre mon bien →',
    submitting: '⏳ Envoi en cours…',
    photosLater: 'Vous pourrez ajouter des photos juste après la soumission.',
    // success screen
    successTitle: '✓ Soumission prise en compte',
    successDesc: 'Votre propriété est en attente d\'examen. Vous pouvez la modifier depuis votre profil tant que le statut reste « En attente ».',
    successRef: 'Référence',
    successRedirectIn: (s: number) => `Redirection vers votre profil dans ${s}s…`,
    successOk: 'OK, voir mon profil',
    types: { villa: 'Villa', condo: 'Condominium', hotel: 'Hôtel / Resort', bungalow: 'Bungalow', 'eco-resort': 'Éco-resort', 'co-living': 'Co-living', 'boutique-hotel': 'Boutique Hotel', land: 'Terrain', other: 'Autre' } as Record<TypeKey, string>,
    pools: { '': '—', private: 'Privée', shared: 'Partagée', none: 'Aucune' } as Record<PoolKey, string>,
    countries: { TH: '🇹🇭 Thaïlande', FR: '🇫🇷 France', PT: '🇵🇹 Portugal', ES: '🇪🇸 Espagne', MA: '🇲🇦 Maroc', OTHER: 'Autre' } as Record<CountryKey, string>,
  },
  en: {
    loading: 'Loading…',
    back: '← My profile',
    title: 'List a property',
    intro: 'Describe your property in detail. More info = faster review. Fields marked',
    introSuffix: 'are required.',
    emailUnverifiedTitle: 'Verify your email before submitting',
    emailUnverifiedBody: (e: string) => <>You must confirm <strong>{e}</strong> before you can list a property.</>,
    emailSentOk: '✓ Email sent. Check your inbox.',
    resendBtn: 'Resend verification email',
    resending: 'Sending…',
    resendIn: (s: number) => `Resend in ${s}s`,
    kybInfoTitle: 'ℹ️ Documents required upon acceptance',
    kybInfoBody: 'If your property is selected, we will request: porter passport, title deed, company DBD extract (<3 months) and director nomination.',
    sIdentity: '🏷️ Identity',
    sValue: '📊 Value & surface',
    sDescription: '🏡 Description',
    sChars: '📐 Extended characteristics',
    sSituation: '📍 Location',
    sAmenities: '✅ Amenities',
    sLease: '⚖️ Lease & legal structure',
    sContact: '✉️ Contact',
    optional: 'Optional',
    hintChars: 'More physical detail helps review.',
    hintSituation: 'Access, points of interest, distances.',
    hintAmenities: 'Max 50 amenities · 80 characters each.',
    hintLease: 'If you don\'t know these details, leave blank — LOWI will fill in.',
    fTitle: 'Property name',
    fType: 'Type', fCountry: 'Country', fCity: 'City / Area',
    selectPh: 'Select…',
    fValue: 'Estimated value (THB)', fSurface: 'Surface (sqm)', fBedrooms: 'Bedrooms',
    fDescription: 'Property description',
    fDescPh: 'Description, history, rental potential, distinctive features…',
    fDescCount: (n: number) => `${n} / 4000 · minimum 20 characters`,
    fBathrooms: 'Bathrooms', fPool: 'Pool', fView: 'View',
    fBeach: 'Beach access', fAirport: 'Airport', fHospital: 'Hospital',
    amenityPh: 'Fiber WiFi, Infinity pool, Air conditioning…',
    amenityAdd: '+ Add',
    amenityNone: 'None added',
    fLeaseYears: 'Lease duration (years)', fLeaseRemaining: 'Remaining (years)', fLeaseExpiry: 'Expiry year',
    fLeaseType: 'Lease type', fTrustee: 'Trustee', fArbitration: 'Arbitration clause',
    fLegalNote: 'Additional legal note',
    fLegalNotePh: 'Any relevant legal element (clean title, no mortgage, etc.)',
    fContactEmail: 'Contact email',
    contactHint: (curr: string) => `This email is used for communications about your property. May differ from your account email (${curr || '—'}).`,
    errEmailNotVerified: 'Please verify your email first before submitting.',
    submitBtn: 'Submit my property →',
    submitting: '⏳ Submitting…',
    photosLater: 'You can add photos right after submission.',
    successTitle: '✓ Submission received',
    successDesc: 'Your property is pending review. You can edit it from your profile while the status is "Pending".',
    successRef: 'Reference',
    successRedirectIn: (s: number) => `Redirecting to your profile in ${s}s…`,
    successOk: 'OK, view my profile',
    types: { villa: 'Villa', condo: 'Condominium', hotel: 'Hotel / Resort', bungalow: 'Bungalow', 'eco-resort': 'Eco-resort', 'co-living': 'Co-living', 'boutique-hotel': 'Boutique Hotel', land: 'Land', other: 'Other' } as Record<TypeKey, string>,
    pools: { '': '—', private: 'Private', shared: 'Shared', none: 'None' } as Record<PoolKey, string>,
    countries: { TH: '🇹🇭 Thailand', FR: '🇫🇷 France', PT: '🇵🇹 Portugal', ES: '🇪🇸 Spain', MA: '🇲🇦 Morocco', OTHER: 'Other' } as Record<CountryKey, string>,
  },
  th: {
    loading: 'กำลังโหลด…',
    back: '← โปรไฟล์ของฉัน',
    title: 'เสนออสังหาริมทรัพย์',
    intro: 'อธิบายอสังหาริมทรัพย์ของคุณโดยละเอียด ข้อมูลมากขึ้น = ตรวจสอบเร็วขึ้น ช่องที่มีเครื่องหมาย',
    introSuffix: 'จำเป็นต้องกรอก',
    emailUnverifiedTitle: 'กรุณายืนยันอีเมลก่อนส่ง',
    emailUnverifiedBody: (e: string) => <>คุณต้องยืนยัน <strong>{e}</strong> ก่อนจึงจะลงประกาศได้</>,
    emailSentOk: '✓ ส่งอีเมลแล้ว ตรวจสอบกล่องจดหมายของคุณ',
    resendBtn: 'ส่งอีเมลยืนยันอีกครั้ง',
    resending: 'กำลังส่ง…',
    resendIn: (s: number) => `ส่งใหม่ใน ${s}วินาที`,
    kybInfoTitle: 'ℹ️ เอกสารที่จำเป็นเมื่อได้รับการอนุมัติ',
    kybInfoBody: 'หากอสังหาริมทรัพย์ของคุณได้รับการคัดเลือก เราจะขอ: หนังสือเดินทางผู้ถือ โฉนด ใบ DBD (<3 เดือน) และใบแต่งตั้งกรรมการ',
    sIdentity: '🏷️ ข้อมูลทั่วไป',
    sValue: '📊 มูลค่า & พื้นที่',
    sDescription: '🏡 รายละเอียด',
    sChars: '📐 คุณสมบัติเพิ่มเติม',
    sSituation: '📍 ที่ตั้ง',
    sAmenities: '✅ สิ่งอำนวยความสะดวก',
    sLease: '⚖️ สัญญาเช่า & โครงสร้างทางกฎหมาย',
    sContact: '✉️ ติดต่อ',
    optional: 'ไม่บังคับ',
    hintChars: 'ข้อมูลเพิ่มเติมช่วยให้การตรวจสอบเร็วขึ้น',
    hintSituation: 'การเข้าถึง สถานที่สำคัญ ระยะทาง',
    hintAmenities: 'สูงสุด 50 รายการ · 80 ตัวอักษรต่อรายการ',
    hintLease: 'หากไม่ทราบข้อมูลเหล่านี้ ปล่อยว่างไว้ได้ — LOWI จะกรอกให้',
    fTitle: 'ชื่อทรัพย์สิน',
    fType: 'ประเภท', fCountry: 'ประเทศ', fCity: 'เมือง / พื้นที่',
    selectPh: 'เลือก…',
    fValue: 'มูลค่าประมาณ (บาท)', fSurface: 'พื้นที่ (ตร.ม.)', fBedrooms: 'ห้องนอน',
    fDescription: 'คำอธิบายทรัพย์สิน',
    fDescPh: 'การนำเสนอ ประวัติ ศักยภาพในการเช่า ลักษณะเฉพาะ…',
    fDescCount: (n: number) => `${n} / 4000 · ขั้นต่ำ 20 ตัวอักษร`,
    fBathrooms: 'ห้องน้ำ', fPool: 'สระว่ายน้ำ', fView: 'วิว',
    fBeach: 'เข้าถึงชายหาด', fAirport: 'สนามบิน', fHospital: 'โรงพยาบาล',
    amenityPh: 'WiFi ไฟเบอร์ สระว่ายน้ำขอบเรียบ แอร์…',
    amenityAdd: '+ เพิ่ม',
    amenityNone: 'ยังไม่ได้เพิ่ม',
    fLeaseYears: 'ระยะเวลาเช่า (ปี)', fLeaseRemaining: 'คงเหลือ (ปี)', fLeaseExpiry: 'ปีหมดอายุ',
    fLeaseType: 'ประเภทสัญญาเช่า', fTrustee: 'ผู้ดูแล (Trustee)', fArbitration: 'เงื่อนไขอนุญาโตตุลาการ',
    fLegalNote: 'หมายเหตุทางกฎหมายเพิ่มเติม',
    fLegalNotePh: 'รายละเอียดทางกฎหมายที่เกี่ยวข้อง (โฉนดสะอาด ไม่มีจำนอง ฯลฯ)',
    fContactEmail: 'อีเมลติดต่อ',
    contactHint: (curr: string) => `อีเมลนี้ใช้สำหรับการติดต่อเกี่ยวกับทรัพย์สินของคุณ อาจแตกต่างจากอีเมลบัญชี (${curr || '—'})`,
    errEmailNotVerified: 'กรุณายืนยันอีเมลก่อนส่ง',
    submitBtn: 'ส่งทรัพย์สินของฉัน →',
    submitting: '⏳ กำลังส่ง…',
    photosLater: 'คุณสามารถเพิ่มรูปภาพได้หลังการส่ง',
    successTitle: '✓ รับใบสมัครแล้ว',
    successDesc: 'อสังหาริมทรัพย์ของคุณกำลังรอการตรวจสอบ คุณสามารถแก้ไขได้จากโปรไฟล์ของคุณตราบใดที่สถานะเป็น "รอ"',
    successRef: 'รหัสอ้างอิง',
    successRedirectIn: (s: number) => `กำลังเปลี่ยนเส้นทางไปยังโปรไฟล์ใน ${s}วินาที…`,
    successOk: 'ตกลง ดูโปรไฟล์',
    types: { villa: 'วิลล่า', condo: 'คอนโด', hotel: 'โรงแรม / รีสอร์ต', bungalow: 'บังกะโล', 'eco-resort': 'รีสอร์ตเชิงนิเวศ', 'co-living': 'โคลิฟวิ่ง', 'boutique-hotel': 'บูทีคโฮเทล', land: 'ที่ดิน', other: 'อื่นๆ' } as Record<TypeKey, string>,
    pools: { '': '—', private: 'ส่วนตัว', shared: 'ส่วนกลาง', none: 'ไม่มี' } as Record<PoolKey, string>,
    countries: { TH: '🇹🇭 ไทย', FR: '🇫🇷 ฝรั่งเศส', PT: '🇵🇹 โปรตุเกส', ES: '🇪🇸 สเปน', MA: '🇲🇦 โมร็อกโก', OTHER: 'อื่นๆ' } as Record<CountryKey, string>,
  },
} as const

// ── UI helpers ───────────────────────────────────────────────────────────────
const card: React.CSSProperties = {
  background: '#fff',
  border: '1px solid var(--inv-border)',
  borderRadius: 8,
  padding: 22,
  marginBottom: 16,
}
const sectionHeader: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  cursor: 'pointer',
  userSelect: 'none' as const,
}
const sectionTitle: React.CSSProperties = {
  fontSize: 15, fontWeight: 700, color: 'var(--inv-navy)',
  margin: 0, display: 'flex', alignItems: 'center', gap: 8,
}
const reqStar: React.CSSProperties = { color: '#dc2626', marginLeft: 2 }
const subLabel: React.CSSProperties = {
  fontSize: 12, color: 'var(--inv-muted)', marginTop: 4,
}
const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }
const grid3: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }

function Section({
  title, badge, hint, children, defaultOpen = true,
}: {
  title: string
  badge?: string
  hint?: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="inv-card" style={card}>
      <div style={sectionHeader} onClick={() => setOpen(o => !o)}>
        <h2 style={sectionTitle}>
          {title}
          {badge && (
            <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', background: '#f3f4f6', color: 'var(--inv-muted)', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {badge}
            </span>
          )}
        </h2>
        <span style={{ fontSize: 13, color: 'var(--inv-muted)', transition: 'transform .15s', transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}>▾</span>
      </div>
      {hint && open && <p style={{ ...subLabel, marginTop: 6, marginBottom: 0 }}>{hint}</p>}
      {open && <div style={{ marginTop: 18 }}>{children}</div>}
    </div>
  )
}

function Required() { return <span style={reqStar}>*</span> }

// ── Page principale ──────────────────────────────────────────────────────────
export default function NewPropertyPage() {
  const router = useRouter()
  const { lang } = useLang()
  const t = I18N[lang]

  const [emailVerified, setEmailVerified] = useState<boolean | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')
  const [resending, setResending] = useState(false)
  const [resendOk, setResendOk] = useState(false)
  const [cooldownUntil, setCooldownUntil] = useState<number>(0)
  const [nowMs, setNowMs] = useState(() => Date.now())
  useEffect(() => {
    if (!cooldownUntil || cooldownUntil <= Date.now()) return
    const id = setInterval(() => setNowMs(Date.now()), 1000)
    return () => clearInterval(id)
  }, [cooldownUntil])
  const remaining = cooldownUntil > nowMs ? Math.ceil((cooldownUntil - nowMs) / 1000) : 0
  const isCooling = remaining > 0

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/invest/login?redirect=/properties/new'); return }
      setEmailVerified(!!user.email_confirmed_at)
      setUserEmail(user.email ?? '')
    })
  }, [router])

  // Required
  const [title, setTitle]               = useState('')
  const [type, setType]                 = useState<TypeKey | ''>('')
  const [country, setCountry]           = useState<CountryKey>('TH')
  const [city, setCity]                 = useState('')
  const [value, setValue]               = useState('')
  const [surface, setSurface]           = useState('')
  const [bedrooms, setBedrooms]         = useState('')
  const [description, setDescription]   = useState('')
  const [email, setEmail]               = useState('')

  // Optional
  const [bathrooms, setBathrooms]       = useState('')
  const [poolType, setPoolType]         = useState<PoolKey>('')
  const [viewDesc, setViewDesc]         = useState('')
  const [beach, setBeach]               = useState('')
  const [airport, setAirport]           = useState('')
  const [hospital, setHospital]         = useState('')
  const [leaseYears, setLeaseYears]                 = useState('')
  const [leaseRemainingYears, setLeaseRemainingYears] = useState('')
  const [leaseExpiryYear, setLeaseExpiryYear]       = useState('')
  const [leaseType, setLeaseType]           = useState('')
  const [trustee, setTrustee]               = useState('')
  const [arbitration, setArbitration]       = useState('')
  const [legalNote, setLegalNote]           = useState('')
  const [amenityInput, setAmenityInput] = useState('')
  const [amenities, setAmenities]       = useState<string[]>([])

  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')
  // Success screen
  const [submitted, setSubmitted] = useState<{ public_id: string; title: string } | null>(null)
  const [redirectIn, setRedirectIn] = useState(5)
  useEffect(() => {
    if (!submitted) return
    if (redirectIn <= 0) { router.replace('/profile'); return }
    const id = setTimeout(() => setRedirectIn(s => s - 1), 1000)
    return () => clearTimeout(id)
  }, [submitted, redirectIn, router])

  function addAmenity() {
    const v = amenityInput.trim().slice(0, 80)
    if (!v) return
    setAmenities(a => a.length >= 50 ? a : [...a, v])
    setAmenityInput('')
  }
  function removeAmenity(i: number) {
    setAmenities(a => a.filter((_, idx) => idx !== i))
  }

  function num(v: string): number | null {
    if (!v.trim()) return null
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }

  async function handleResend() {
    if (resending || isCooling || !userEmail) return
    setResending(true)
    setResendOk(false)
    try {
      const supabase = createClient()
      await supabase.auth.resend({ type: 'signup', email: userEmail })
      setResendOk(true)
      setCooldownUntil(Date.now() + 120_000)
      setNowMs(Date.now())
    } finally {
      setResending(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        title:               title.trim(),
        property_type:       type,
        location_country:    country,
        location_city:       city.trim(),
        estimated_value_thb: num(value),
        surface_sqm:         num(surface),
        bedrooms:            num(bedrooms),
        description:         description.trim(),
        contact_email:       email.trim(),
      }
      if (bathrooms)               body.bathrooms              = num(bathrooms)
      if (poolType)                body.pool_type              = poolType
      if (viewDesc.trim())         body.view_description       = viewDesc.trim()
      if (beach.trim())            body.beach_access           = beach.trim()
      if (airport.trim())          body.airport_access         = airport.trim()
      if (hospital.trim())         body.hospital_access        = hospital.trim()
      if (leaseYears)              body.lease_years            = num(leaseYears)
      if (leaseRemainingYears)     body.lease_remaining_years  = num(leaseRemainingYears)
      if (leaseExpiryYear)         body.lease_expiry_year      = num(leaseExpiryYear)
      if (leaseType.trim())        body.lease_type             = leaseType.trim()
      if (trustee.trim())          body.trustee_name           = trustee.trim()
      if (arbitration.trim())      body.arbitration_clause     = arbitration.trim()
      if (legalNote.trim())        body.legal_note             = legalNote.trim()
      if (amenities.length)        body.amenities              = amenities

      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error === 'EMAIL_NOT_VERIFIED') {
          setError(t.errEmailNotVerified)
          setEmailVerified(false)
        } else {
          throw new Error(data.error ?? 'Erreur')
        }
        return
      }
      // Affiche la success screen au lieu de rediriger directement
      setSubmitted({ public_id: data.public_id, title: data.title })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  if (emailVerified === null) {
    return <div style={{ padding: 60, textAlign: 'center', color: 'var(--inv-muted)' }}>⏳ {t.loading}</div>
  }

  // ── Success screen : prend toute la zone après soumission ─────────────
  if (submitted) {
    return (
      <div style={{
        maxWidth: 560, margin: '0 auto', padding: '60px 16px',
        textAlign: 'center', animation: 'lowi-fadein .35s ease-out',
      }}>
        <div style={{
          fontSize: 64, lineHeight: 1, marginBottom: 18,
          animation: 'lowi-pop .45s cubic-bezier(.34,1.56,.64,1)',
        }}>✓</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--inv-navy)', margin: '0 0 12px' }}>
          {t.successTitle}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--inv-muted)', lineHeight: 1.6, margin: '0 0 24px' }}>
          {t.successDesc}
        </p>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 14px', background: 'var(--inv-gray)',
          border: '1px solid var(--inv-border)', borderRadius: 20,
          fontSize: 12, fontWeight: 600, marginBottom: 32,
        }}>
          <span style={{ color: 'var(--inv-muted)' }}>{t.successRef}</span>
          <code style={{ color: 'var(--inv-navy)', fontFamily: 'monospace' }}>{submitted.public_id}</code>
        </div>

        <div style={{ marginBottom: 16, fontSize: 13, color: 'var(--inv-muted)' }}>
          {t.successRedirectIn(redirectIn)}
        </div>

        {/* Progress bar décompte */}
        <div style={{
          maxWidth: 240, margin: '0 auto 24px',
          height: 4, background: 'var(--inv-gray)', borderRadius: 2, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${(redirectIn / 5) * 100}%`,
            background: 'var(--inv-navy)',
            transition: 'width 1s linear',
          }} />
        </div>

        <button
          onClick={() => router.replace('/profile')}
          className="inv-btn inv-btn-gold"
          style={{ padding: '11px 28px', fontSize: 14 }}
        >
          {t.successOk}
        </button>

        <style>{`
          @keyframes lowi-fadein { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes lowi-pop { 0% { transform: scale(.3); opacity: 0; } 60% { transform: scale(1.15); opacity: 1; } 100% { transform: scale(1); } }
        `}</style>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 16px 64px' }}>

      <div style={{ marginBottom: 24 }}>
        <Link href="/profile" style={{ background: 'none', border: 'none', color: 'var(--inv-muted)', cursor: 'pointer', fontSize: 13, textDecoration: 'none', display: 'inline-block', marginBottom: 12 }}>
          {t.back}
        </Link>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--inv-navy)', marginBottom: 4 }}>
          {t.title}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--inv-muted)', margin: 0 }}>
          {t.intro} <span style={reqStar}>*</span> {t.introSuffix}
        </p>
      </div>

      {!emailVerified && (
        <div style={{
          background: '#fffbeb', border: '1px solid #f59e0b', borderRadius: 8,
          padding: '16px 18px', marginBottom: 20, fontSize: 13,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#92400e', fontWeight: 700, marginBottom: 6 }}>
            ⚠️ {t.emailUnverifiedTitle}
          </div>
          <p style={{ color: '#78350f', margin: '0 0 10px' }}>
            {t.emailUnverifiedBody(userEmail)}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {resendOk && (
              <span style={{ color: '#15803d', fontSize: 12, fontWeight: 600 }}>{t.emailSentOk}</span>
            )}
            <button
              onClick={handleResend}
              disabled={resending || isCooling}
              style={{
                background: (resending || isCooling) ? '#d97706' : '#f59e0b',
                color: '#fff', border: 'none', borderRadius: 6,
                padding: '8px 16px', fontSize: 12, fontWeight: 700,
                cursor: (resending || isCooling) ? 'not-allowed' : 'pointer',
                opacity: isCooling ? 0.7 : 1,
                whiteSpace: 'nowrap', fontFamily: 'inherit',
                display: 'inline-flex', alignItems: 'center',
                minWidth: 220, justifyContent: 'center',
                transition: 'opacity .2s, background .2s',
              }}
            >
              {resending && <span className="lowi-spinner" />}
              {resending ? t.resending
                : isCooling ? t.resendIn(remaining)
                : t.resendBtn}
            </button>
          </div>
        </div>
      )}

      <div style={{
        background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8,
        padding: '12px 16px', marginBottom: 24, fontSize: 13, color: '#1e40af',
      }}>
        <strong>{t.kybInfoTitle}</strong><br />
        {t.kybInfoBody}
      </div>

      <form onSubmit={handleSubmit}>

        <Section title={t.sIdentity} defaultOpen>
          <div>
            <label className="inv-label">{t.fTitle} <Required /></label>
            <input type="text" className="inv-input" value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={200} required placeholder="Ex. Chalok Pool Villa — Koh Tao" />
          </div>
          <div style={{ ...grid3, marginTop: 12 }}>
            <div>
              <label className="inv-label">{t.fType} <Required /></label>
              <select className="inv-input" value={type} onChange={e => setType(e.target.value as TypeKey)}
                required style={{ appearance: 'auto' }}>
                <option value="">{t.selectPh}</option>
                {TYPE_KEYS.map(k => <option key={k} value={k}>{t.types[k]}</option>)}
              </select>
            </div>
            <div>
              <label className="inv-label">{t.fCountry} <Required /></label>
              <select className="inv-input" value={country} onChange={e => setCountry(e.target.value as CountryKey)}
                required style={{ appearance: 'auto' }}>
                {COUNTRY_KEYS.map(c => <option key={c} value={c}>{t.countries[c]}</option>)}
              </select>
            </div>
            <div>
              <label className="inv-label">{t.fCity} <Required /></label>
              <input type="text" className="inv-input" value={city}
                onChange={e => setCity(e.target.value)}
                maxLength={100} required placeholder="Koh Tao" />
            </div>
          </div>
        </Section>

        <Section title={t.sValue} defaultOpen>
          <div style={grid3}>
            <div>
              <label className="inv-label">{t.fValue} <Required /></label>
              <input type="number" className="inv-input" value={value}
                onChange={e => setValue(e.target.value)}
                min={1} required placeholder="35 000 000" />
            </div>
            <div>
              <label className="inv-label">{t.fSurface} <Required /></label>
              <input type="number" className="inv-input" value={surface}
                onChange={e => setSurface(e.target.value)}
                min={1} required placeholder="250" />
            </div>
            <div>
              <label className="inv-label">{t.fBedrooms} <Required /></label>
              <input type="number" className="inv-input" value={bedrooms}
                onChange={e => setBedrooms(e.target.value)}
                min={0} required placeholder="4" />
            </div>
          </div>
        </Section>

        <Section title={t.sDescription} defaultOpen>
          <label className="inv-label">{t.fDescription} <Required /></label>
          <textarea
            className="inv-input" value={description}
            onChange={e => setDescription(e.target.value)}
            rows={6} minLength={20} maxLength={4000} required
            placeholder={t.fDescPh}
            style={{ resize: 'vertical', fontFamily: 'inherit' }}
          />
          <div style={subLabel}>{t.fDescCount(description.length)}</div>
        </Section>

        <Section title={t.sChars} badge={t.optional} defaultOpen={false} hint={t.hintChars}>
          <div style={grid3}>
            <div>
              <label className="inv-label">{t.fBathrooms}</label>
              <input type="number" className="inv-input" value={bathrooms}
                onChange={e => setBathrooms(e.target.value)} min={0} />
            </div>
            <div>
              <label className="inv-label">{t.fPool}</label>
              <select className="inv-input" value={poolType}
                onChange={e => setPoolType(e.target.value as PoolKey)} style={{ appearance: 'auto' }}>
                {POOL_TYPES.map(p => <option key={p} value={p}>{t.pools[p]}</option>)}
              </select>
            </div>
            <div>
              <label className="inv-label">{t.fView}</label>
              <input type="text" className="inv-input" value={viewDesc}
                onChange={e => setViewDesc(e.target.value)}
                maxLength={200} />
            </div>
          </div>
        </Section>

        <Section title={t.sSituation} badge={t.optional} defaultOpen={false} hint={t.hintSituation}>
          <div style={grid2}>
            <div>
              <label className="inv-label">{t.fBeach}</label>
              <input type="text" className="inv-input" value={beach}
                onChange={e => setBeach(e.target.value)} maxLength={200} />
            </div>
            <div>
              <label className="inv-label">{t.fAirport}</label>
              <input type="text" className="inv-input" value={airport}
                onChange={e => setAirport(e.target.value)} maxLength={200} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="inv-label">{t.fHospital}</label>
              <input type="text" className="inv-input" value={hospital}
                onChange={e => setHospital(e.target.value)} maxLength={200} />
            </div>
          </div>
        </Section>

        <Section title={t.sAmenities} badge={t.optional} defaultOpen={false} hint={t.hintAmenities}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {amenities.map((a, i) => (
              <span key={i} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: '#f5f5f3', border: '1px solid var(--inv-border)', borderRadius: 16,
                padding: '4px 10px', fontSize: 13,
              }}>
                {a}
                <button
                  type="button"
                  onClick={() => removeAmenity(i)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--inv-muted)', fontSize: 14, padding: 0, lineHeight: 1 }}
                  title="×"
                >×</button>
              </span>
            ))}
            {amenities.length === 0 && <span style={{ ...subLabel, marginTop: 0 }}>{t.amenityNone}</span>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text" className="inv-input" style={{ flex: 1 }}
              value={amenityInput}
              onChange={e => setAmenityInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAmenity() } }}
              placeholder={t.amenityPh}
              maxLength={80}
            />
            <button type="button" onClick={addAmenity} style={{
              padding: '0 18px', background: 'var(--inv-navy)', color: '#fff',
              border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 13,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>{t.amenityAdd}</button>
          </div>
        </Section>

        <Section title={t.sLease} badge={t.optional} defaultOpen={false} hint={t.hintLease}>
          <div style={grid3}>
            <div>
              <label className="inv-label">{t.fLeaseYears}</label>
              <input type="number" className="inv-input" value={leaseYears}
                onChange={e => setLeaseYears(e.target.value)} min={1} placeholder="20" />
            </div>
            <div>
              <label className="inv-label">{t.fLeaseRemaining}</label>
              <input type="number" className="inv-input" value={leaseRemainingYears}
                onChange={e => setLeaseRemainingYears(e.target.value)} min={0} placeholder="18" />
            </div>
            <div>
              <label className="inv-label">{t.fLeaseExpiry}</label>
              <input type="number" className="inv-input" value={leaseExpiryYear}
                onChange={e => setLeaseExpiryYear(e.target.value)} placeholder="2045" />
            </div>
          </div>
          <div style={{ ...grid2, marginTop: 12 }}>
            <div>
              <label className="inv-label">{t.fLeaseType}</label>
              <input type="text" className="inv-input" value={leaseType}
                onChange={e => setLeaseType(e.target.value)} maxLength={200} />
            </div>
            <div>
              <label className="inv-label">{t.fTrustee}</label>
              <input type="text" className="inv-input" value={trustee}
                onChange={e => setTrustee(e.target.value)} maxLength={200} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="inv-label">{t.fArbitration}</label>
              <input type="text" className="inv-input" value={arbitration}
                onChange={e => setArbitration(e.target.value)} maxLength={500} />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <label className="inv-label">{t.fLegalNote}</label>
            <textarea className="inv-input" value={legalNote}
              onChange={e => setLegalNote(e.target.value)}
              rows={3} maxLength={2000}
              style={{ resize: 'vertical', fontFamily: 'inherit' }}
              placeholder={t.fLegalNotePh} />
          </div>
        </Section>

        <Section title={t.sContact} defaultOpen>
          <label className="inv-label">{t.fContactEmail} <Required /></label>
          <input type="email" className="inv-input" value={email}
            onChange={e => setEmail(e.target.value)}
            maxLength={200} required placeholder="votre@email.com" />
          <div style={subLabel}>{t.contactHint(userEmail)}</div>
        </Section>

        {error && (
          <div style={{
            padding: '12px 16px', background: '#fef2f2',
            border: '1px solid #fecaca', borderRadius: 6,
            fontSize: 13, color: 'var(--inv-red)', marginBottom: 16,
          }}>⚠ {error}</div>
        )}

        <button
          type="submit"
          className="inv-btn inv-btn-gold"
          disabled={saving || !emailVerified}
          style={{ padding: '13px', width: '100%', fontSize: 14 }}
        >
          {saving ? t.submitting : t.submitBtn}
        </button>
        <p style={{ ...subLabel, textAlign: 'center', marginTop: 10 }}>
          {t.photosLater}
        </p>
      </form>
    </div>
  )
}
