# apps/web/components/sales-analytics-view.tsx

- **役割**: 再利用可能なUIコンポーネント
- **KPI/チャート**: 色・指標の一貫性を維持。前処理はサーバ側、描画はクライアント。

- **セキュリティ**: 機密（GAS_API_KEY等）はサーバのみ参照。クライアントへ出さない。
- **キャッシュ**: GAS=120秒、UI=ISR+SWR の多層キャッシュを意識する。

---
<reference (first 20 lines)>

````
import { Card } from "@/components/ui/card"
import { getSalesAnalytics, getSalesData } from "@/lib/data"
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react"
import Link from "next/link"
import { SalesChart } from "./sales-chart"

export async function SalesAnalyticsView() {
  const analytics = await getSalesAnalytics()
  const salesData = await getSalesData()

  const totalSales = salesData.reduce((sum, day) => sum + day.totalSales, 0)
  const totalProfit = salesData.reduce((sum, day) => sum + day.totalProfit, 0)
  const averageProfitRate = (totalProfit / totalSales) * 100

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 rounded-lg">
````
