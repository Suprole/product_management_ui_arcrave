import { NextResponse } from 'next/server'
import type { MasterViewResponse } from '@/lib/types'
import { getResponseStatus } from '@/lib/server/gas'
import { withReadDebugHeaders } from '@/lib/server/read-debug'
import { buildProductSuggestResponse, readMastersModel } from '@/lib/server/read-models'

export async function GET(req: Request) {
  const startedAt = Date.now()
  try {
    const { searchParams } = new URL(req.url)
    const q = (searchParams.get('q') || '').trim()
    const limit = Number(searchParams.get('limit') || '10')
    if (!q) {
      return withReadDebugHeaders(NextResponse.json({ items: [] }), {
        endpoint: 'products/suggest',
        startedAt,
      })
    }

    const result = await readMastersModel<MasterViewResponse>()
    const { data } = result
    if (!('items' in data)) {
      return withReadDebugHeaders(
        NextResponse.json(data, { status: getResponseStatus(data) }),
        { endpoint: 'products/suggest', source: result.source, objectPath: result.objectPath, startedAt },
      )
    }

    const suggestResult = buildProductSuggestResponse(data.items, q, limit)
    return withReadDebugHeaders(
      NextResponse.json({ items: suggestResult.items }),
      { endpoint: 'products/suggest', source: result.source, objectPath: result.objectPath, startedAt },
    )
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}


