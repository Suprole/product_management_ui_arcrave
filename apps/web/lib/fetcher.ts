import { NextResponse } from 'next/server'

export async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, { cache: 'no-store', ...init })
  const data = await res.json().catch(() => ({}))
  const statusFromBody = typeof data === 'object' && data && '_status' in data ? (data as any)._status : undefined
  if (!res.ok || (statusFromBody && statusFromBody >= 400)) {
    const error = (data && (data.error || data.message)) || `Request failed: ${res.status}`
    throw new Error(String(error))
  }
  return data as T
}


