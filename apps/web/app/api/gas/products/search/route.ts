import { NextRequest, NextResponse } from 'next/server'
import type { MasterViewResponse } from '@/lib/types'
import { getResponseStatus } from '@/lib/server/gas'
import { buildProductSearchResponse, readMastersModel } from '@/lib/server/read-models'

/**
 * 商品検索（発注作成用）
 * GET /api/gas/products/search
 * 
 * Query params:
 * - q: 検索キーワード（商品名部分一致）
 * - sku: SKU（完全一致）
 * - asin: ASIN（完全一致）
 * - productCode: 商品コード（完全一致）
 * - brand: ブランド（完全一致）
 * - limit: 最大件数
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const { data } = await readMastersModel<MasterViewResponse>()

    if ('items' in data) {
      return NextResponse.json(
        buildProductSearchResponse(data.items, {
          q: searchParams.get('q'),
          sku: searchParams.get('sku'),
          asin: searchParams.get('asin'),
          productCode: searchParams.get('productCode'),
          brand: searchParams.get('brand'),
          limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : null,
        }),
      )
    }

    return NextResponse.json(data, { status: getResponseStatus(data) })
  } catch (error) {
    console.error('Failed to search products:', error)
    return NextResponse.json(
      { error: 'Failed to search products', details: String(error) },
      { status: 500 },
    )
  }
}

