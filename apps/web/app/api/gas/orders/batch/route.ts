import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const base = process.env.GAS_API_BASE!
  const key = process.env.GAS_API_KEY!

  if (!base || !key) {
    return NextResponse.json(
      { error: 'GAS API configuration is missing' },
      { status: 500 },
    )
  }

  try {
    const payload = await req.json()

    if (!Array.isArray(payload.items) || payload.items.length === 0) {
      return NextResponse.json({ error: 'items is required' }, { status: 400 })
    }

    const invalidItem = payload.items.find(
      (item: { sku?: string; setCount?: number }) => !item?.sku || !item?.setCount || item.setCount <= 0,
    )

    if (invalidItem) {
      return NextResponse.json(
        { error: 'Each item requires sku and setCount > 0' },
        { status: 400 },
      )
    }

    const url = new URL(base)
    url.searchParams.set('action', 'createOrdersBatch')
    url.searchParams.set('key', key)

    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = await res.json()

    if (data._status && data._status >= 400) {
      return NextResponse.json(data, { status: data._status })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Failed to create batch orders:', error)
    return NextResponse.json(
      { error: 'Failed to create batch orders', details: String(error) },
      { status: 500 },
    )
  }
}
