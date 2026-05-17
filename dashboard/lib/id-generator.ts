import { customAlphabet } from 'nanoid'

const ALPHABET = '23456789abcdefghijkmnpqrstuvwxyz' // 32 chars, exclut 0,1,l,o
const generate = customAlphabet(ALPHABET, 8)

export function generateUserId(): string {
  return `usr_${generate()}`
}

export function generatePropertyId(): string {
  return `prop_${generate()}`
}
