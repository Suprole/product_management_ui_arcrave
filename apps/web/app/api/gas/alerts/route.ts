import { NextResponse } from 'next/server'
import { AlertsResponse } from '@/lib/types'
import { getResponseStatus } from '@/lib/server/gas'
import { readRangeModel } from '@/lib/server/read-models'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const { data } = await readRangeModel<AlertsResponse>('alerts', 'alerts', {
      from: searchParams.get('from') || undefined,
      to: searchParams.get('to') || undefined,
      grain: searchParams.get('grain') || undefined,
      tab: searchParams.get('tab') || undefined,
    })
    return NextResponse.json(data, { status: getResponseStatus(data) })
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}


