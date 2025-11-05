"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { useEffect, useState } from "react"
import { DashboardResponse } from "@/lib/types"

export function InventoryChart() {
  const [data, setData] = useState<{ date: string; stock: number; orders90d: number }[]>([])

  useEffect(() => {
    const run = async () => {
      const res = await fetch(`/api/gas/dashboard`, { cache: 'no-store' })
      const json = (await res.json()) as DashboardResponse
      if ('kpi' in json && json.series?.stock) {
        const stockMap = new Map(json.series.stock.map((p) => [p.date, p.value]))
        const orders90dMap = new Map((json.series.orders90d || []).map((p) => [p.date, p.value]))
        
        const dates = Array.from(stockMap.keys()).sort()
        const rows = dates.map((date) => ({
          date: date.substring(5),
          stock: stockMap.get(date) || 0,
          orders90d: orders90dMap.get(date) || 0,
        }))
        setData(rows)
      }
    }
    run()
  }, [])

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">在庫推移</CardTitle>
        <p className="text-sm text-muted-foreground">在庫数量と過去90日注文件数の推移</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={data}>
            <defs>
              <linearGradient id="colorInventory" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="rgb(168 85 247)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="rgb(168 85 247)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgb(39 39 42)" />
            <XAxis dataKey="date" stroke="rgb(161 161 170)" fontSize={12} />
            <YAxis 
              yAxisId="left"
              stroke="rgb(161 161 170)" 
              fontSize={12} 
              label={{ value: '在庫数', angle: -90, position: 'insideLeft' }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="rgb(161 161 170)" 
              fontSize={12}
              label={{ value: '注文件数', angle: 90, position: 'insideRight' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgb(24 24 27)",
                border: "1px solid rgb(39 39 42)",
                borderRadius: "0.5rem",
              }}
              labelStyle={{ color: "rgb(250 250 250)" }}
              formatter={(value: number, name: string) => {
                if (name === '在庫数') return [`${value}個`, name]
                if (name === '過去90日注文') return [`${value}件`, name]
                return [value, name]
              }}
            />
            <Legend />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="stock"
              stroke="rgb(168 85 247)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorInventory)"
              name="在庫数"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="orders90d"
              stroke="rgb(251 191 36)"
              strokeWidth={2}
              dot={false}
              name="過去90日注文"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
