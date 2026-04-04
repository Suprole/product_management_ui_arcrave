import { NextResponse } from 'next/server'
import { ProductsResponse } from '@/lib/types'
import { getResponseStatus } from '@/lib/server/gas'
import { readRangeModel } from '@/lib/server/read-models'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const { data } = await readRangeModel<ProductsResponse>('products', 'products', {
      from: searchParams.get('from') || undefined,
      to: searchParams.get('to') || undefined,
      grain: searchParams.get('grain') || undefined,
      q: searchParams.get('q') || undefined,
      category: searchParams.get('category') || undefined,
      sort: searchParams.get('sort') || undefined,
      order: searchParams.get('order') || undefined,
      page: searchParams.get('page') || undefined,
      pageSize: searchParams.get('pageSize') || undefined,
    })
    return NextResponse.json(data, { status: getResponseStatus(data) })
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}


