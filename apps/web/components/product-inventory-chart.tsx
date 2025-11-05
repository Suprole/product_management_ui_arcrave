"use client"

import { Card } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export function ProductInventoryChart({ data }: { data: { date: string; stock: number }[] }) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">在庫推移</h3>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data}>
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
            formatter={(value: number) => `${value}個`}
          />
          <Area type="monotone" dataKey="stock" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  )
}
