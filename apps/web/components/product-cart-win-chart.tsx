"use client"

import { Card } from "@/components/ui/card"

export function ProductCartWinChart({ rows }: { rows: { label: string; value: number }[] }) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">カート取得率（7日/30日/全期間）</h3>
      <div className="grid grid-cols-3 gap-4">
        {rows.map((r) => (
          <div key={r.label} className="p-4 rounded-lg border border-border text-center">
            <div className="text-sm text-muted-foreground">{r.label}</div>
            <div className="text-2xl font-bold">{r.value.toFixed(1)}%</div>
          </div>
        ))}
      </div>
    </Card>
  )
}
