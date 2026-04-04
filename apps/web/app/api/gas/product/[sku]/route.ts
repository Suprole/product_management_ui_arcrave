import { NextResponse } from 'next/server'
import { ProductDetailResponse } from '@/lib/types'
import { getResponseStatus } from '@/lib/server/gas'
import { withReadDebugHeaders } from '@/lib/server/read-debug'
import { readProductModel } from '@/lib/server/read-models'

export async function GET(
  req: Request,
  ctx: { params: Promise<{ sku: string }> }
) {
  const startedAt = Date.now()
  try {
    const { searchParams } = new URL(req.url)
    const { sku } = await ctx.params
    const result = await readProductModel<ProductDetailResponse>(sku, {
      from: searchParams.get('from') || undefined,
      to: searchParams.get('to') || undefined,
      grain: searchParams.get('grain') || undefined,
    })
    return withReadDebugHeaders(
      NextResponse.json(result.data, { status: getResponseStatus(result.data) }),
      { endpoint: 'product', source: result.source, objectPath: result.objectPath, startedAt },
    )
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}


