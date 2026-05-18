// Shared identity type — used by KYC, profile pages, and any future script

export type IdentityData = {
  first_name:    string
  last_name:     string
  maiden_name:   string   // nom d'usage / nom de naissance pour les femmes
  sex:           'M' | 'F' | 'autre' | ''
  birth_date:    string   // ISO date string YYYY-MM-DD
  birth_place:   string
  birth_country: string
}

export const EMPTY_IDENTITY: IdentityData = {
  first_name:    '',
  last_name:     '',
  maiden_name:   '',
  sex:           '',
  birth_date:    '',
  birth_place:   '',
  birth_country: '',
}

export function identityComplete(data: IdentityData): boolean {
  return !!(
    data.first_name &&
    data.last_name &&
    data.sex &&
    data.birth_date &&
    data.birth_place &&
    data.birth_country
  )
}

// Sprint 9 : la convention Drive est maintenant `usr_xxx` (profiles.public_id),
// gérée directement par lib/google-drive.ts:ensureUserFolder.
// L'ancienne `identityFolderName(first_name, last_name)` est retirée — voir
// scripts/migrate-drive-naming.ts pour la migration des dossiers existants.
