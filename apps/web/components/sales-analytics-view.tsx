"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, Percent, Loader2 } from "lucide-react"
import { DashboardResponse } from "@/lib/types"
import { SalesChartByPeriod } from "./sales-chart-by-period"
import { Skeleton } from "@/components/ui/skeleton"

// 期間計算ヘルパー
function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getDateRange(daysAgo: number | null): { from?: string; to?: string } {
  const today = new Date()
  const to = formatDate(today)
  
  if (daysAgo === null) {
    // 全期間: 十分に古い日付を指定（スプレッドシートのデータ開始より前）
    return { from: '2020-01-01', to }
  }
  
  const fromDate = new Date(today)
  fromDate.setDate(today.getDate() - daysAgo)
  const from = formatDate(fromDate)
  
  return { from, to }
}

type PeriodData = {
  period: string
  revenue: number
  profit: number
  profitRate: number
  revenueSeriesData: any[]
  profitSeriesData: any[]
  profitRateSeriesData: any[]
  ordersSeriesData: any[]
  periodFrom?: string
  periodTo?: string
}

export function SalesAnalyticsView() {
  const [periodData, setPeriodData] = useState<PeriodData[]>([])
  const [loadingStage, setLoadingStage] = useState<number>(0) // 0: 未開始, 1: 30日, 2: 90日, 3: 全期間
  const hasFetchedRef = useRef(false) // 二重実行防止フラグ

  useEffect(() => {
    // 既に実行済みの場合はスキップ
    if (hasFetchedRef.current) return

    const fetchData = async () => {
      hasFetchedRef.current = true
      try {
        // 段階的にデータを取得（重要度の高いものから）
        const periods = [
          { label: '過去30日', range: getDateRange(30), stage: 1 },
          { label: '過去90日', range: getDateRange(90), stage: 2 },
          { label: '全期間', range: getDateRange(null), stage: 3 },
        ]

        // 各期間のデータを順次取得
        for (const period of periods) {
          setLoadingStage(period.stage)
          
          const params = new URLSearchParams()
          if (period.range.from) params.set('from', period.range.from)
          if (period.range.to) params.set('to', period.range.to)
          const url = `/api/gas/dashboard?${params.toString()}`
          const res = await fetch(url, { cache: 'no-store' })
          const data = (await res.json()) as DashboardResponse

          const formattedData: PeriodData = (() => {
            if (!('kpi' in data)) {
              return {
                period: period.label,
                revenue: 0,
                profit: 0,
                profitRate: 0,
                revenueSeriesData: [],
                profitSeriesData: [],
                profitRateSeriesData: [],
                ordersSeriesData: [],
              }
            }
            const profit = (data.kpi as any).profit ?? 0
            const revenue = data.kpi.revenue ?? 0
            const profitRate = revenue ? (profit / revenue * 100) : 0
            
            return {
              period: period.label,
              revenue,
              profit,
              profitRate,
              revenueSeriesData: data.series?.revenue || [],
              profitSeriesData: data.series?.profit || [],
              profitRateSeriesData: data.series?.profitRate || [],
              ordersSeriesData: data.series?.orders || [],
              periodFrom: (data.kpi as any).periodFrom,
              periodTo: (data.kpi as any).periodTo,
            }
          })()

          // データを段階的に追加（重複を防ぐ）
          setPeriodData((prev) => {
            // 既存の同じ期間のデータを除外
            const filtered = prev.filter(pd => pd.period !== formattedData.period)
            const updated = [...filtered, formattedData]
            // 表示順序を調整: 全期間, 90日, 30日
            return updated.sort((a, b) => {
              const order = ['全期間', '過去90日', '過去30日']
              return order.indexOf(a.period) - order.indexOf(b.period)
            })
          })
        }
      } catch (error) {
        console.error('売上データの取得に失敗しました:', error)
      } finally {
        setLoadingStage(0)
      }
    }

    fetchData()
  }, [])

  const formatJPY = (n: number) => `¥${Math.round(n).toLocaleString()}`

  // ローディングメッセージを段階に応じて変更
  const getLoadingMessage = () => {
    switch (loadingStage) {
      case 1: return '過去30日のデータを取得中...'
      case 2: return '過去90日のデータを取得中...'
      case 3: return '全期間のデータを取得中...'
      default: return 'データを読み込んでいます...'
    }
  }

  // 初回ローディング（データが1つもない場合）
  if (periodData.length === 0 && loadingStage > 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 p-4 bg-blue-500/10 rounded-lg">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          <div>
            <p className="font-semibold text-blue-500">売上データを読み込んでいます...</p>
            <p className="text-sm text-muted-foreground">{getLoadingMessage()}</p>
          </div>
        </div>

        {/* 総売上 - スケルトン */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-500" />
              総売上
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-9 w-32" />
                  <Skeleton className="h-4 w-40" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 総利益 - スケルトン */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              総利益
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-9 w-32" />
                  <Skeleton className="h-4 w-40" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 利益率 - スケルトン */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-purple-500" />
              利益率
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-9 w-24" />
                  <Skeleton className="h-4 w-40" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 期間の表示順序
  const periodOrder = ['全期間', '過去90日', '過去30日']
  const displayData = periodOrder.map(period => 
    periodData.find(pd => pd.period === period)
  )

  return (
    <div className="space-y-6">
      {/* 段階的ローディング中のステータス表示 */}
      {loadingStage > 0 && (
        <div className="flex items-center gap-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          <p className="text-sm text-blue-500">{getLoadingMessage()}</p>
        </div>
      )}

      {/* 総売上 - 期間別 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-500" />
            総売上
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayData.map((pd, idx) => (
              pd ? (
                <div key={pd.period} className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{pd.period}</p>
                  <p className="text-3xl font-bold text-blue-500">{formatJPY(pd.revenue)}</p>
                  {pd.periodFrom && pd.periodTo && (
                    <p className="text-xs text-muted-foreground">
                      {pd.periodFrom} ～ {pd.periodTo}
                    </p>
                  )}
                </div>
              ) : (
                <div key={periodOrder[idx]} className="space-y-2">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-9 w-32" />
                  <Skeleton className="h-4 w-40" />
                </div>
              )
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 総利益 - 期間別 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            総利益
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayData.map((pd, idx) => (
              pd ? (
                <div key={pd.period} className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{pd.period}</p>
                  <p className={`text-3xl font-bold ${pd.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatJPY(pd.profit)}
                  </p>
                  {pd.periodFrom && pd.periodTo && (
                    <p className="text-xs text-muted-foreground">
                      {pd.periodFrom} ～ {pd.periodTo}
                    </p>
                  )}
                </div>
              ) : (
                <div key={periodOrder[idx]} className="space-y-2">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-9 w-32" />
                  <Skeleton className="h-4 w-40" />
                </div>
              )
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 利益率 - 期間別 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5 text-purple-500" />
            利益率
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayData.map((pd, idx) => (
              pd ? (
                <div key={pd.period} className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{pd.period}</p>
                  <p className={`text-3xl font-bold ${pd.profitRate >= 0 ? 'text-purple-500' : 'text-red-500'}`}>
                    {pd.profitRate.toFixed(2)}%
                  </p>
                  {pd.periodFrom && pd.periodTo && (
                    <p className="text-xs text-muted-foreground">
                      {pd.periodFrom} ～ {pd.periodTo}
                    </p>
                  )}
                </div>
              ) : (
                <div key={periodOrder[idx]} className="space-y-2">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-9 w-24" />
                  <Skeleton className="h-4 w-40" />
                </div>
              )
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 売上推移グラフ - 期間別 */}
      <div className="grid grid-cols-1 gap-6">
        {periodData.map((pd) => (
          <SalesChartByPeriod 
            key={pd.period}
            period={pd.period}
            revenueSeries={pd.revenueSeriesData}
            profitSeries={pd.profitSeriesData}
            profitRateSeries={pd.profitRateSeriesData}
            ordersSeries={pd.ordersSeriesData}
          />
        ))}
      </div>
    </div>
  )
}
