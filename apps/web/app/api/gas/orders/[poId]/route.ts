import { NextRequest, NextResponse } from 'next/server';

/**
 * 発注詳細取得
 * GET /api/gas/orders/:poId
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ poId: string }> }
) {
  const base = process.env.GAS_API_BASE!;
  const key = process.env.GAS_API_KEY!;

  if (!base || !key) {
    return NextResponse.json(
      { error: 'GAS API configuration is missing' },
      { status: 500 }
    );
  }

  // paramsを先にawait
  const { poId } = await params;

  const url = new URL(base);
  url.searchParams.set('path', 'orders');
  url.searchParams.set('key', key);
  url.searchParams.set('po_id', poId);

  try {
    const res = await fetch(url.toString(), {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    const data = await res.json();
    
    if (data._status && data._status >= 400) {
      return NextResponse.json(data, { status: data._status });
    }
    
    // items配列から単一オブジェクトを抽出
    if (data.items && data.items.length > 0) {
      return NextResponse.json(data.items[0]);
    }
    
    return NextResponse.json(
      { error: 'Order not found', po_id: poId },
      { status: 404 }
    );
  } catch (error) {
    console.error('Failed to fetch order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * 発注更新
 * PUT /api/gas/orders/:poId
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ poId: string }> }
) {
  const base = process.env.GAS_API_BASE!;
  const key = process.env.GAS_API_KEY!;

  if (!base || !key) {
    return NextResponse.json(
      { error: 'GAS API configuration is missing' },
      { status: 500 }
    );
  }

  const url = new URL(base);
  url.searchParams.set('action', 'updateOrder');
  url.searchParams.set('key', key);

  try {
    // paramsを先にawait
    const { poId } = await params;
    const payload = await req.json();
    
    // po_idをpayloadに追加
    payload.po_id = poId;
    
    const res = await fetch(url.toString(), {
      method: 'POST', // GASではPOSTとして処理
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
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to update order:', error);
    return NextResponse.json(
      { error: 'Failed to update order', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * PATCH もサポート（PUTと同じ処理）
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ poId: string }> }
) {
  return PUT(req, { params });
}

