import { NextResponse } from 'next/server'
import { AlertsResponse } from '@/lib/types'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const base = process.env.GAS_API_BASE
    const key = process.env.GAS_API_KEY
    if (!base || !key) return NextResponse.json({ error: 'server misconfigured' }, { status: 500 })

    const url = new URL(base)
    url.searchParams.set('key', key)
    url.searchParams.set('path', 'alerts')
    ;['from', 'to', 'tab'].forEach((k) => {
      const v = searchParams.get(k)
      if (v) url.searchParams.set(k, v)
    })

    const res = await fetch(url.toString(), { cache: 'no-store' })
    const data = (await res.json()) as AlertsResponse & { _status?: number }
    const status = data && (data as any)._status && Number((data as any)._status) >= 400 ? Number((data as any)._status) : res.status
    return NextResponse.json(data, { status })
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}


