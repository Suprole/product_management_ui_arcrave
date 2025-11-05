# apps/web/app/sales/page.tsx

- **ルート**: /sales
- **役割**: ページコンポーネント（UI合成、ページ固有の状態管理）
- **データ**: 現状はモック。将来はサーバコンポーネント/サーバルート経由に切替。

- **セキュリティ**: 機密（GAS_API_KEY等）はサーバのみ参照。クライアントへ出さない。
- **キャッシュ**: GAS=120秒、UI=ISR+SWR の多層キャッシュを意識する。

---
<reference (first 20 lines)>

````
import { DashboardHeader } from "@/components/dashboard-header"
import { SalesAnalyticsView } from "@/components/sales-analytics-view"

export default function SalesPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">売上分析</h1>
          <p className="text-muted-foreground mt-2">商品別売上ランキングと利益率分析</p>
        </div>

        <SalesAnalyticsView />
      </main>
    </div>
  )
}

````

## データマッピング
- 売上分析ビュー: sales-analytics-view.tsx のマッピング参照

## 必要API
- GET /api/gas/dashboard?from&to&grain
- GET /api/gas/products?from&to&grain