# apps/web/app/page.tsx

- **ルート**: /
- **役割**: ページコンポーネント（UI合成、ページ固有の状態管理）
- **データ**: 現状はモック。将来はサーバコンポーネント/サーバルート経由に切替。

- **セキュリティ**: 機密（GAS_API_KEY等）はサーバのみ参照。クライアントへ出さない。
- **キャッシュ**: GAS=120秒、UI=ISR+SWR の多層キャッシュを意識する。

---
<reference (first 20 lines)>

````
import { Suspense } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { KPICards } from "@/components/kpi-cards"
import { SalesChart } from "@/components/sales-chart"
import { InventoryChart } from "@/components/inventory-chart"
import { TopProductsTable } from "@/components/top-products-table"
import { AlertsPanel } from "@/components/alerts-panel"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-6 space-y-6">
        <Suspense fallback={<div>Loading...</div>}>
          <KPICards />
        </Suspense>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Suspense fallback={<div>Loading...</div>}>
````

## データマッピング（ダッシュボード構成）
- KPI: kpi-cards.tsx のマッピング参照（「日次売上集計」「全体在庫日次集計」「商品状態」「商品別カート取得率集計」「商品マスタ」）
- 売上チャート: sales-chart.tsx のマッピング参照（「日次売上集計」）
- 在庫チャート: inventory-chart.tsx のマッピング参照（「全体在庫日次集計」）
- トップ商品: top-products-table.tsx のマッピング参照（「商品別売上集計」「商品マスタ」「商品状態」）
- アラート: alerts-panel.tsx のマッピング参照（「商品状態」「商品別売上集計」「商品マスタ」）

## 必要API
- GET /api/gas/dashboard
- GET /api/gas/products
- GET /api/gas/alerts