# apps/web/app/inventory/page.tsx

- **ルート**: /inventory
- **役割**: ページコンポーネント（UI合成、ページ固有の状態管理）
- **データ**: 現状はモック。将来はサーバコンポーネント/サーバルート経由に切替。

- **セキュリティ**: 機密（GAS_API_KEY等）はサーバのみ参照。クライアントへ出さない。
- **キャッシュ**: GAS=120秒、UI=ISR+SWR の多層キャッシュを意識する。

---
<reference (first 20 lines)>

````
import { DashboardHeader } from "@/components/dashboard-header"
import { InventoryManagementView } from "@/components/inventory-management-view"

export default function InventoryPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">在庫管理</h1>
          <p className="text-muted-foreground mt-2">在庫状況とアラート管理</p>
        </div>

        <InventoryManagementView />
      </main>
    </div>
  )
}

````

## データマッピング
- 在庫KPI/アラート: inventory-management-view.tsx のマッピング参照
- 在庫推移: inventory-chart.tsx のマッピング参照

## 必要API
- GET /api/gas/alerts
- GET /api/gas/dashboard
- GET /api/gas/products