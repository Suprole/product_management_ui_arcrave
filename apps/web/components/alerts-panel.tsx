import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, TrendingDown, Package } from "lucide-react"
import { headers } from "next/headers"

export async function AlertsPanel() {
  const h = await headers()
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000'
  const proto = h.get('x-forwarded-proto') || (process.env.VERCEL ? 'https' : 'http')
  const base = `${proto}://${host}`
  // products から集計: 推奨発注数>0, 在庫=0, 利益<0
  // 全期間のデータを取得
  const res = await fetch(`${base}/api/gas/products?from=2000-01-01`, { cache: 'no-store' })
  const data = await res.json()
  const items: any[] = Array.isArray(data?.items) ? data.items : []
  const lowStockCount = items.filter((it) => (it.recommendedOrderQty ?? 0) > 0).length
  const outOfStockCount = items.filter((it) => (it.stock ?? it.currentStock ?? 0) === 0).length
  const lowProfitCount = items.filter((it) => (it.profit ?? it.totalProfit ?? 0) < 0).length

  const alerts = [
    {
      type: "warning",
      icon: AlertTriangle,
      title: "在庫不足",
      count: lowStockCount,
      description: `${lowStockCount}商品が在庫不足です`,
      color: "text-warning",
    },
    {
      type: "error",
      icon: Package,
      title: "在庫切れ",
      count: outOfStockCount,
      description: `${outOfStockCount}商品が在庫切れです`,
      color: "text-destructive",
    },
    {
      type: "info",
      icon: TrendingDown,
      title: "赤字商品",
      count: lowProfitCount,
      description: `${lowProfitCount}商品が赤字です`,
      color: "text-destructive",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {alerts.map((alert) => (
        <Card key={alert.title} className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className={`p-2 rounded-lg bg-muted ${alert.color}`}>
                <alert.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{alert.title}</h3>
                  <span className={`text-2xl font-bold ${alert.color}`}>{alert.count}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
