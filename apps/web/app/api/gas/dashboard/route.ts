import { NextResponse } from 'next/server'
import { DashboardResponse } from '@/lib/types'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const from = searchParams.get('from') || undefined
    const to = searchParams.get('to') || undefined
    const grain = (searchParams.get('grain') || undefined) as any

    const base = process.env.GAS_API_BASE
    const key = process.env.GAS_API_KEY
    
    // 環境変数の詳細チェック
    if (!base || !key) {
      console.error('❌ GAS API configuration error:', {
        hasBase: !!base,
        hasKey: !!key,
        baseLength: base?.length || 0,
        keyLength: key?.length || 0,
      })
      return NextResponse.json({ 
        error: 'GAS API not configured', 
        details: {
          missingBase: !base,
          missingKey: !key,
        }
      }, { status: 500 })
    }

    const url = new URL(base)
    url.searchParams.set('key', key)
    url.searchParams.set('path', 'dashboard')
    if (from) url.searchParams.set('from', from)
    if (to) url.searchParams.set('to', to)
    if (grain) url.searchParams.set('grain', String(grain))

    console.log('📡 Calling GAS API:', {
      path: 'dashboard',
      from,
      to,
      grain,
    })

    const res = await fetch(url.toString(), { cache: 'no-store' })
    
    // レスポンスのコンテンツタイプを確認
    const contentType = res.headers.get('content-type')
    
    if (!res.ok) {
      console.error('❌ GAS API error:', {
        status: res.status,
        statusText: res.statusText,
        contentType,
      })
      
      // HTMLが返ってきた場合
      if (contentType?.includes('text/html')) {
        const htmlText = await res.text()
        console.error('HTML response (first 500 chars):', htmlText.substring(0, 500))
        return NextResponse.json({ 
          error: 'GAS API returned HTML instead of JSON',
          details: 'Authentication may have failed or GAS API is not properly configured',
          httpStatus: res.status,
        }, { status: 500 })
      }
    }

    // JSONパース前にコンテンツタイプを確認
    if (contentType && !contentType.includes('application/json') && !contentType.includes('text/plain')) {
      const text = await res.text()
      console.error('❌ Unexpected content type:', contentType)
      console.error('Response (first 500 chars):', text.substring(0, 500))
      return NextResponse.json({ 
        error: 'Unexpected response format from GAS API',
        contentType,
        preview: text.substring(0, 200),
      }, { status: 500 })
    }

    const data = (await res.json()) as DashboardResponse & { _status?: number }
    const status = data && (data as any)._status && Number((data as any)._status) >= 400 ? Number((data as any)._status) : res.status
    return NextResponse.json(data, { status })
  } catch (err: any) {
    console.error('❌ Dashboard API error:', err)
    return NextResponse.json({ 
      error: String(err?.message || err),
      stack: process.env.NODE_ENV === 'development' ? err?.stack : undefined,
    }, { status: 500 })
  }
}


