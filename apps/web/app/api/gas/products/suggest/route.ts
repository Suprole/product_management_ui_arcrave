import { NextResponse } from 'next/server'
import { ProductsResponse } from '@/lib/types'

export async function GET(req: Request) {
  try {
    const { searchParams, origin, pathname } = new URL(req.url)
    const q = (searchParams.get('q') || '').trim()
    const limit = Number(searchParams.get('limit') || '10')
    if (!q) return NextResponse.json({ items: [] })

    // Call internal products endpoint to leverage aggregation
    const url = new URL('/api/gas/products', origin)
    // pass-through range params if provided
    ;['from', 'to', 'grain', 'category'].forEach((k) => {
      const v = searchParams.get(k)
      if (v) url.searchParams.set(k, v)
    })
    const res = await fetch(url.toString(), { cache: 'no-store' })
    const data = (await res.json()) as ProductsResponse
    if (!('items' in data)) return NextResponse.json({ error: 'upstream error' }, { status: 500 })

    const items = (data.items || [])
      .filter((it) =>
        [it.sku, it.asin, it.name].some((v) => (v || '').toLowerCase().includes(q.toLowerCase()))
      )
      .slice(0, Math.max(0, limit))
      .map((it) => ({ sku: it.sku, asin: it.asin, name: it.name, category: it.category }))

    return NextResponse.json({ items })
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}


