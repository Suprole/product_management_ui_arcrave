import { NextRequest, NextResponse } from 'next/server';

/**
 * 発注一覧取得
 * GET /api/gas/orders
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
  url.searchParams.set('path', 'orders');
  url.searchParams.set('key', key);
  
  // フィルタパラメータを転送
  const filterParams = [
    'po_id',
    'statuses',
    'sku',
    'asin',
    'seller',
    'productName',
    'fromDate',
    'toDate'
  ];
  
  filterParams.forEach(param => {
    const value = searchParams.get(param);
    if (value) {
      url.searchParams.set(param, value);
    }
  });

  try {
    const res = await fetch(url.toString(), {
      cache: 'no-store', // 発注データは常に最新を取得
      headers: {
        'Accept': 'application/json',
      },
    });
    
    const data = await res.json();
    
    // GAS側のエラーステータスを処理
    if (data._status && data._status >= 400) {
      return NextResponse.json(data, { status: data._status });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * 発注作成
 * POST /api/gas/orders
 */
export async function POST(req: NextRequest) {
  const base = process.env.GAS_API_BASE!;
  const key = process.env.GAS_API_KEY!;

  if (!base || !key) {
    return NextResponse.json(
      { error: 'GAS API configuration is missing' },
      { status: 500 }
    );
  }

  const url = new URL(base);
  url.searchParams.set('action', 'createOrder');
  url.searchParams.set('key', key);

  try {
    const payload = await req.json();
    
    // バリデーション（基本チェック）
    if (!payload.sku) {
      return NextResponse.json(
        { error: 'SKU is required' },
        { status: 400 }
      );
    }
    
    if (!payload.setCount || payload.setCount <= 0) {
      return NextResponse.json(
        { error: 'setCount must be greater than 0' },
        { status: 400 }
      );
    }
    
    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    const data = await res.json();
    
    if (data._status && data._status >= 400) {
      return NextResponse.json(data, { status: data._status });
    }
    
    // 成功時はキャッシュをクリア（将来実装）
    // revalidatePath('/orders');
    
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Failed to create order:', error);
    return NextResponse.json(
      { error: 'Failed to create order', details: String(error) },
      { status: 500 }
    );
  }
}

