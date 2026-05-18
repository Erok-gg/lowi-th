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
  display_name: z.string().trim().max(100).nullable().optional(),
  first_name:   z.string().trim().max(100).nullable().optional(),
  last_name:    z.string().trim().max(100).nullable().optional(),
  nationality:  z.string().trim().max(100).nullable().optional(),
}).strict() // refuse les clés non listées

// Property lead — create (POST /api/properties)
export const propertyCreateSchema = z.object({
  title:               z.string().trim().min(1).max(200),
  description:         z.string().trim().max(2000).nullable().optional(),
  location_city:       z.string().trim().max(100).nullable().optional(),
  location_country:    z.string().trim().max(50).nullable().optional(),
  property_type:       z.enum(['villa', 'condo', 'hotel', 'land', 'other']).nullable().optional(),
  estimated_value_thb: z.number().int().positive().nullable().optional(),
  surface_sqm:         z.number().int().positive().nullable().optional(),
  bedrooms:            z.number().int().nonnegative().nullable().optional(),
  contact_email:       z.string().trim().email().max(200).nullable().optional()
                        .or(z.literal('').transform(() => null)),
})

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
