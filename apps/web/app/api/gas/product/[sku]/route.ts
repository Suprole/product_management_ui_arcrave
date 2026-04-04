import { NextResponse } from 'next/server'
import { ProductDetailResponse } from '@/lib/types'
import { getResponseStatus } from '@/lib/server/gas'
import { readProductModel } from '@/lib/server/read-models'

export async function GET(
  req: Request,
  ctx: { params: Promise<{ sku: string }> }
) {
  try {
    const { searchParams } = new URL(req.url)
    const { sku } = await ctx.params
    const { data } = await readProductModel<ProductDetailResponse>(sku, {
      from: searchParams.get('from') || undefined,
      to: searchParams.get('to') || undefined,
      grain: searchParams.get('grain') || undefined,
    })
    return NextResponse.json(data, { status: getResponseStatus(data) })
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}


