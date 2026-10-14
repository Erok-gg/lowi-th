import { NextResponse } from 'next/server'
import { sessionCookie } from '@/lib/dataroom/auth'

export async function POST(req) {
  const res = NextResponse.redirect(new URL('/data-room', req.url), 303)
  res.cookies.set(sessionCookie('', 0))
  return res
}
