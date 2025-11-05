"use client"

import { Card } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
type DailyProductSales = { date: string; totalSales: number; totalProfit: number; salesQuantity: number; orderCount: number }

export function ProductSalesChart({ data }: { data: DailyProductSales[] }) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">日次売上推移</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
          <XAxis
            dataKey="date"
            stroke="hsl(var(--muted-foreground))"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => value.split("/").slice(1).join("/")}
          />
          <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
            formatter={(value: number) => `¥${value.toLocaleString()}`}
          />
          <Legend />
          <Line type="monotone" dataKey="totalSales" stroke="#3b82f6" strokeWidth={2} name="売上" dot={false} />
          <Line type="monotone" dataKey="totalProfit" stroke="#10b981" strokeWidth={2} name="利益" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  )
}
