import { NextRequest, NextResponse } from 'next/server';

/**
 * マスタ結合ビュー取得（商品マスタ + 仕入れマスタ）
 * GET /api/gas/masters
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
  const base = process.env.GAS_API_BASE!;
  const key = process.env.GAS_API_KEY!;

  if (!base || !key) {
    return NextResponse.json(
      { error: 'GAS API configuration is missing' },
      { status: 500 }
    );
  }

  const searchParams = req.nextUrl.searchParams;
  
  const url = new URL(base);
  url.searchParams.set('path', 'masterview');
  url.searchParams.set('key', key);
  
  // 検索パラメータを転送
  const queryParams = ['q', 'sku', 'asin', 'productCode', 'brand', 'limit'];
  
  queryParams.forEach(param => {
    const value = searchParams.get(param);
    if (value) {
      url.searchParams.set(param, value);
    }
  });

  try {
    const res = await fetch(url.toString(), {
      // マスタデータは比較的静的なので、短いキャッシュを許可
      next: { revalidate: 300 }, // 5分
      headers: {
        'Accept': 'application/json',
      },
    });
    
    const data = await res.json();
    
    if (data._status && data._status >= 400) {
      return NextResponse.json(data, { status: data._status });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch master view:', error);
    return NextResponse.json(
      { error: 'Failed to fetch master view', details: String(error) },
      { status: 500 }
    );
  }
}

