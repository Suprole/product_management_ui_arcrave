import { NextResponse } from 'next/server'
import type { MasterViewResponse } from '@/lib/types'
import { getResponseStatus } from '@/lib/server/gas'
import { buildProductSuggestResponse, readMastersModel } from '@/lib/server/read-models'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const q = (searchParams.get('q') || '').trim()
    const limit = Number(searchParams.get('limit') || '10')
    if (!q) return NextResponse.json({ items: [] })

    const { data } = await readMastersModel<MasterViewResponse>()
    if (!('items' in data)) {
      return NextResponse.json(data, { status: getResponseStatus(data) })
    }

    const result = buildProductSuggestResponse(data.items, q, limit)
    return NextResponse.json({ items: result.items })
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}


