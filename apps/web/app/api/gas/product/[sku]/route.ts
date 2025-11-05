import { NextResponse } from 'next/server'
import { ProductDetailResponse } from '@/lib/types'

export async function GET(
  req: Request,
  ctx: { params: Promise<{ sku: string }> }
) {
  try {
    const { searchParams } = new URL(req.url)
    const { sku } = await ctx.params
    const base = process.env.GAS_API_BASE
    const key = process.env.GAS_API_KEY
    if (!base || !key) {
      return NextResponse.json({ error: 'server misconfigured' }, { status: 500 })
    }

    const url = new URL(base)
    url.searchParams.set('key', key)
    url.searchParams.set('path', 'product')
    url.searchParams.set('sku', sku)
    ;['from', 'to', 'grain'].forEach((k) => {
      const v = searchParams.get(k)
      if (v) url.searchParams.set(k, v)
    })
    const res = await fetch(url.toString(), { cache: 'no-store' })
    const data = (await res.json()) as ProductDetailResponse & { _status?: number }
    const status = data && (data as any)._status && Number((data as any)._status) >= 400 ? Number((data as any)._status) : res.status
    return NextResponse.json(data, { status })
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}


