"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { useEffect, useMemo, useState } from "react"
import { DashboardResponse } from "@/lib/types"

export function SalesChart() {
  const [series, setSeries] = useState<{ date: string; sales: number; profit: number; profitRate: number }[]>([])

  useEffect(() => {
    const run = async () => {
      const res = await fetch(`/api/gas/dashboard`, { cache: 'no-store' })
      const data = (await res.json()) as DashboardResponse
      if ('kpi' in data && data.series?.revenue) {
        const revenueMap = new Map((data.series.revenue || []).map((p) => [p.date, p.value]))
        const profitMap = new Map((data.series.profit || []).map((p) => [p.date, p.value]))
        const profitRateMap = new Map((data.series.profitRate || []).map((p) => [p.date, p.value]))
        
        const dates = Array.from(revenueMap.keys()).sort()
        const rows = dates.map((date) => ({
          date: date.substring(5),
          sales: revenueMap.get(date) || 0,
          profit: profitMap.get(date) || 0,
          profitRate: profitRateMap.get(date) || 0,
        }))
        setSeries(rows)
      }
    }
    run()
  }, [])

  const chartData = useMemo(() => {
    return series.map((item) => ({
      ...item,
      salesK: Math.round(item.sales / 1000),
      profitK: Math.round(item.profit / 1000),
    }))
  }, [series])

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">売上推移</CardTitle>
        <p className="text-sm text-muted-foreground">売上・利益・利益率の推移</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgb(39 39 42)" />
            <XAxis dataKey="date" stroke="rgb(161 161 170)" fontSize={12} />
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
