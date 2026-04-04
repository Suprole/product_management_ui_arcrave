import { NextResponse } from 'next/server'
import { DashboardResponse } from '@/lib/types'
import { getResponseStatus } from '@/lib/server/gas'
import { readRangeModel } from '@/lib/server/read-models'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const from = searchParams.get('from') || undefined
    const to = searchParams.get('to') || undefined
    const grain = (searchParams.get('grain') || undefined) as any
    const { data } = await readRangeModel<DashboardResponse>('dashboard', 'dashboard', {
      from,
      to,
      grain: grain ? String(grain) : undefined,
    })
    return NextResponse.json(data, { status: getResponseStatus(data) })
  } catch (err: any) {
    console.error('❌ Dashboard API error:', err)
    return NextResponse.json({ 
      error: String(err?.message || err),
      stack: process.env.NODE_ENV === 'development' ? err?.stack : undefined,
    }, { status: 500 })
  }
}


