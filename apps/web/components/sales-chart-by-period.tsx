"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { TimePoint } from "@/lib/types"
import { useMemo } from "react"

type SalesChartByPeriodProps = {
  period: string
  revenueSeries: TimePoint[]
  profitSeries: TimePoint[]
  profitRateSeries: TimePoint[]
  ordersSeries: TimePoint[]
}

export function SalesChartByPeriod({ 
  period, 
  revenueSeries, 
  profitSeries, 
  profitRateSeries, 
  ordersSeries 
}: SalesChartByPeriodProps) {
  const chartData = useMemo(() => {
    // 日付をキーにして各系列をマージ
    const revenueMap = new Map(revenueSeries.map((p) => [p.date, p.value]))
    const profitMap = new Map(profitSeries.map((p) => [p.date, p.value]))
    const profitRateMap = new Map(profitRateSeries.map((p) => [p.date, p.value]))
    const ordersMap = new Map(ordersSeries.map((p) => [p.date, p.value]))
    
    const dates = Array.from(revenueMap.keys()).sort()
    
    return dates.map((date) => ({
      date: date.length > 10 ? date.substring(5) : date,
      salesK: Math.round((revenueMap.get(date) || 0) / 1000),
      profitK: Math.round((profitMap.get(date) || 0) / 1000),
      profitRate: profitRateMap.get(date) || 0,
      orders: ordersMap.get(date) || 0,
    }))
  }, [revenueSeries, profitSeries, profitRateSeries, ordersSeries])

  if (chartData.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">売上推移 - {period}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">データがありません</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">売上推移 - {period}</CardTitle>
        <p className="text-sm text-muted-foreground">売上・利益・注文件数・利益率の推移</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgb(39 39 42)" />
            <XAxis 
              dataKey="date" 
              stroke="rgb(161 161 170)" 
              fontSize={12}
              interval="preserveStartEnd"
              minTickGap={30}
            />
            <YAxis 
              yAxisId="left"
              stroke="rgb(161 161 170)" 
              fontSize={12} 
              tickFormatter={(value) => `¥${value}k`} 
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="rgb(161 161 170)" 
              fontSize={12} 
              tickFormatter={(value) => `${value}%`}
              domain={[0, 'auto']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgb(24 24 27)",
                border: "1px solid rgb(39 39 42)",
                borderRadius: "0.5rem",
              }}
              labelStyle={{ color: "rgb(250 250 250)" }}
              formatter={(value: number, name: string) => {
                if (name === '利益率') return [`${value.toFixed(1)}%`, name]
                if (name === '注文件数') return [`${Math.round(value)}件`, name]
                return [`¥${Math.round(value)}k`, name]
              }}
            />
            <Legend />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="salesK" 
              stroke="rgb(99 102 241)" 
              strokeWidth={2} 
              name="売上"
              dot={false} 
            />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="profitK" 
              stroke="rgb(34 197 94)" 
              strokeWidth={2} 
              name="利益"
              dot={false} 
            />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="orders" 
              stroke="rgb(234 179 8)" 
              strokeWidth={2} 
              name="注文件数"
              dot={false} 
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="profitRate" 
              stroke="rgb(251 146 60)" 
              strokeWidth={2} 
              name="利益率"
              dot={false} 
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

