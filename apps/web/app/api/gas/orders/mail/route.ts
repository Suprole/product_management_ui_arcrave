import { NextRequest, NextResponse } from 'next/server';

/**
 * メール送信
 * POST /api/gas/orders/mail
 * 
 * Body: { type: 'request' | 'delivery', poIds: string[] }
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

  try {
    const body = await req.json();
    const { type, poIds } = body;
    
    // バリデーション
    if (!type || !['request', 'delivery'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid mail type. Must be "request" or "delivery"' },
        { status: 400 }
      );
    }
    
    if (!poIds || !Array.isArray(poIds) || poIds.length === 0) {
      return NextResponse.json(
        { error: 'poIds array is required' },
        { status: 400 }
      );
    }
    
    // アクション名を決定
    const action = type === 'request' ? 'sendRequestEmail' : 'sendDeliveryEmail';
    
    const url = new URL(base);
    url.searchParams.set('action', action);
    url.searchParams.set('key', key);
    
    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ poIds }),
    });
    
    const data = await res.json();
    
    if (data._status && data._status >= 400) {
      return NextResponse.json(data, { status: data._status });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to send email:', error);
    return NextResponse.json(
      { error: 'Failed to send email', details: String(error) },
      { status: 500 }
    );
  }
}

