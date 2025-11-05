import { NextRequest, NextResponse } from 'next/server';

/**
 * ステータス変更
 * PUT /api/gas/orders/:poId/status
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
  url.searchParams.set('action', 'changeStatus');
  url.searchParams.set('key', key);

  try {
    // paramsを先にawait
    const { poId } = await params;
    const payload = await req.json();
    
    // バリデーション
    if (!payload.newStatus) {
      return NextResponse.json(
        { error: 'newStatus is required' },
        { status: 400 }
      );
    }
    
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
    console.error('Failed to change status:', error);
    return NextResponse.json(
      { error: 'Failed to change status', details: String(error) },
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

