# apps/web/app/products/[sku]/page.tsx

- **ルート**: /products/:sku
- **役割**: ページコンポーネント（UI合成、ページ固有の状態管理）
- **データ**: 現状はモック。将来はサーバコンポーネント/サーバルート経由に切替。

- **セキュリティ**: 機密（GAS_API_KEY等）はサーバのみ参照。クライアントへ出さない。
- **キャッシュ**: GAS=120秒、UI=ISR+SWR の多層キャッシュを意識する。

---
<reference (first 20 lines)>

````
import { DashboardHeader } from "@/components/dashboard-header"
import { ProductDetailView } from "@/components/product-detail-view"

export default function ProductDetailPage({ params }: { params: { sku: string } }) {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-6">
        <ProductDetailView sku={params.sku} />
      </main>
    </div>
  )
}

````

## データマッピング
- 詳細ビュー: product-detail-view.tsx のマッピング参照

## 必要API
- GET /api/gas/product/{sku}?from&to&grain