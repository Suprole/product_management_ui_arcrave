import { NextResponse } from 'next/server'
import { AlertsResponse } from '@/lib/types'
import { getResponseStatus } from '@/lib/server/gas'
import { withReadDebugHeaders } from '@/lib/server/read-debug'
import { readRangeModel } from '@/lib/server/read-models'

export async function GET(req: Request) {
  const startedAt = Date.now()
  try {
    const { searchParams } = new URL(req.url)
    const result = await readRangeModel<AlertsResponse>('alerts', 'alerts', {
      from: searchParams.get('from') || undefined,
      to: searchParams.get('to') || undefined,
      grain: searchParams.get('grain') || undefined,
      tab: searchParams.get('tab') || undefined,
    })
    return withReadDebugHeaders(
      NextResponse.json(result.data, { status: getResponseStatus(result.data) }),
      { endpoint: 'alerts', source: result.source, objectPath: result.objectPath, startedAt },
    )
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}


