import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Temporary security diagnostic. Middleware requires an authenticated session.
// Remove this endpoint immediately after verification.
export async function GET() {
  const version = process.version
  const match = /^v(\d+)\.(\d+)\.(\d+)/.exec(version)
  const patched = Boolean(match && Number(match[1]) === 24 && (Number(match[2]) > 22 || (Number(match[2]) === 22 && Number(match[3]) >= 1)))
  return NextResponse.json({ nodeVersion: version, patchedForOctober2026: patched }, { headers: { "Cache-Control": "no-store" } })
}
