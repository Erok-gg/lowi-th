import { NextResponse } from 'next/server'

// Free interbank rates — open.er-api.com, no API key, updates every 24h
// Cache 1 hour on Vercel edge

export const revalidate = 3600

export async function GET() {
  try {
    const [usdRes, eurRes] = await Promise.all([
      fetch('https://open.er-api.com/v6/latest/USD', { next: { revalidate: 3600 } }),
      fetch('https://open.er-api.com/v6/latest/EUR', { next: { revalidate: 3600 } }),
    ])

    if (!usdRes.ok || !eurRes.ok) throw new Error('Exchange rate fetch failed')

    const usd = await usdRes.json()
    const eur = await eurRes.json()

    return NextResponse.json({
      usd_to_thb:   usd.rates.THB,
      eur_to_thb:   eur.rates.THB,
      thb_to_usd:   1 / usd.rates.THB,
      thb_to_eur:   1 / eur.rates.THB,
      updated_at:   usd.time_last_update_utc,
      source:       'open.er-api.com',
    }, {
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=7200' }
    })
  } catch {
    // Fallback rates if API is down
    return NextResponse.json({
      usd_to_thb: 34.5,
      eur_to_thb: 37.8,
      thb_to_usd: 0.029,
      thb_to_eur: 0.026,
      updated_at: null,
      source: 'fallback',
    })
  }
}
