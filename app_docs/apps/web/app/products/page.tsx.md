# apps/web/app/products/page.tsx

- **ルート**: /products
- **役割**: ページコンポーネント（UI合成、ページ固有の状態管理）
- **データ**: 現状はモック。将来はサーバコンポーネント/サーバルート経由に切替。

- **セキュリティ**: 機密（GAS_API_KEY等）はサーバのみ参照。クライアントへ出さない。
- **キャッシュ**: GAS=120秒、UI=ISR+SWR の多層キャッシュを意識する。

---
<reference (first 20 lines)>

````
import { DashboardHeader } from "@/components/dashboard-header"
import { ProductsTable } from "@/components/products-table"

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">商品管理</h1>
          <p className="text-muted-foreground mt-2">全商品の在庫状況、売上、利益を管理</p>
        </div>

        <ProductsTable />
      </main>
    </div>
  )
}

````

## データマッピング
- 一覧テーブル: products-table.tsx のマッピング参照

## 必要API
- GET /api/gas/products?from&to&grain&q&category&sort&order