/**
 * Schémas Zod partagés — Sprint 10.
 * On reste sur des règles pragmatiques : longueurs max, formats, enums.
 * Pour les routes admin avec whitelist manuelle robuste, on les laisse
 * intactes pour le moment (notamment /api/admin/properties/[id] PATCH).
 */
import { z } from 'zod'

// Email + honeypot — signup
export const signupSchema = z.object({
  email:   z.string().trim().toLowerCase().email().max(200),
  _trap:   z.string().optional(),  // honeypot — si rempli côté API => silent OK
})

// Identité utilisateur (KYC)
export const identitySchema = z.object({
  first_name:    z.string().trim().max(100).nullable().optional(),
  last_name:     z.string().trim().max(100).nullable().optional(),
  maiden_name:   z.string().trim().max(100).nullable().optional(),
  sex:           z.enum(['M', 'F', 'autre', '']).nullable().optional(),
  birth_date:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional().or(z.literal('')),
  birth_place:   z.string().trim().max(100).nullable().optional(),
  birth_country: z.string().trim().max(100).nullable().optional(),
})

// Profile patch
export const profilePatchSchema = z.object({
  display_name:   z.string().trim().max(100).nullable().optional(),
  first_name:     z.string().trim().max(100).nullable().optional(),
  last_name:      z.string().trim().max(100).nullable().optional(),
  nationality:    z.string().trim().max(100).nullable().optional(),
  preferred_lang: z.enum(['fr', 'en', 'th']).optional(),
}).strict() // refuse les clés non listées

// Property lead — schéma étendu (POST + PATCH)
// Mêmes champs que la page admin WYSIWYG /projets/[publicId]/edit, MOINS
// les champs LOWI-only (irr_pct, distribution_pct, min_ticket_thb, shares_*,
// funding_status, investor_memo_url) qui restent réservés à l'admin.
const PROPERTY_TYPES = ['villa', 'condo', 'hotel', 'land', 'bungalow', 'eco-resort', 'co-living', 'boutique-hotel', 'other'] as const
const POOL_TYPES = ['private', 'shared', 'none'] as const

// Convertit "" → null pour les inputs optionnels HTML
const optStr = (max: number) =>
  z.union([z.string().trim().max(max), z.null(), z.literal('').transform(() => null)]).optional()
const optInt = () =>
  z.union([z.number().int().nonnegative(), z.null()]).optional()
const optPosInt = () =>
  z.union([z.number().int().positive(), z.null()]).optional()

export const propertyCreateSchema = z.object({
  // ── Required ──
  title:               z.string().trim().min(1).max(200),
  property_type:       z.enum(PROPERTY_TYPES),
  location_country:    z.string().trim().min(2).max(50),
  location_city:       z.string().trim().min(1).max(100),
  estimated_value_thb: z.number().int().positive(),
  surface_sqm:         z.number().int().positive(),
  bedrooms:            z.number().int().nonnegative(),
  description:         z.string().trim().min(20).max(4000),
  contact_email:       z.string().trim().email().max(200),

  // ── Caractéristiques optionnelles ──
  bathrooms:           optInt(),
  pool_type:           z.union([z.enum(POOL_TYPES), z.null(), z.literal('').transform(() => null)]).optional(),
  view_description:    optStr(200),

  // ── Situation optionnelle ──
  beach_access:        optStr(200),
  airport_access:      optStr(200),
  hospital_access:     optStr(200),

  // ── Bail optionnel ──
  lease_years:           optPosInt(),
  lease_remaining_years: optInt(),
  lease_expiry_year:     optInt(),

  // ── Juridique optionnel ──
  lease_type:          optStr(200),
  trustee_name:        optStr(200),
  arbitration_clause:  optStr(500),
  legal_note:          optStr(2000),

  // ── Équipements optionnels ──
  amenities: z.array(z.string().trim().min(1).max(80)).max(50).nullable().optional(),
})

// PATCH = tous les champs optionnels (partial)
export const propertyUpdateSchema = propertyCreateSchema.partial()

export type PropertyCreateInput = z.infer<typeof propertyCreateSchema>
export type PropertyUpdateInput = z.infer<typeof propertyUpdateSchema>

/**
 * Helper standard : parse + retourne soit les données soit une 400 prête à renvoyer.
 * Usage :
 *   const parsed = parseOr400(signupSchema, body)
 *   if (parsed instanceof NextResponse) return parsed
 *   const { email } = parsed
 */
import { NextResponse } from 'next/server'

export function parseOr400<T extends z.ZodType>(
  schema: T,
  data: unknown,
): z.infer<T> | NextResponse {
  const result = schema.safeParse(data)
  if (!result.success) {
    // En prod : message générique pour éviter la fuite de structure
    const isProd = process.env.NODE_ENV === 'production'
    return NextResponse.json(
      { error: isProd ? 'Invalid input' : `Invalid: ${result.error.issues.map(i => i.path.join('.') + ': ' + i.message).join('; ')}` },
      { status: 400 },
    )
  }
  return result.data
}
