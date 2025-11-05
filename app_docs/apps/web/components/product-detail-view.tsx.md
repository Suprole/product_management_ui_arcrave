# apps/web/components/product-detail-view.tsx

- **役割**: 再利用可能なUIコンポーネント

- **セキュリティ**: 機密（GAS_API_KEY等）はサーバのみ参照。クライアントへ出さない。
- **キャッシュ**: GAS=120秒、UI=ISR+SWR の多層キャッシュを意識する。

---
<reference (first 20 lines)>

````
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getProductDetail, getProductDailySales, getProductInventoryHistory, getProductCartWinRate } from "@/lib/data"
import { ArrowLeft, Package, TrendingUp, ShoppingCart, Star } from "lucide-react"
import Link from "next/link"
import { ProductSalesChart } from "./product-sales-chart"
import { ProductInventoryChart } from "./product-inventory-chart"
import { ProductCartWinChart } from "./product-cart-win-chart"

export async function ProductDetailView({ sku }: { sku: string }) {
  const product = await getProductDetail(sku)
  const dailySales = await getProductDailySales(sku)
  const inventoryHistory = await getProductInventoryHistory(sku)
  const cartWinRate = await getProductCartWinRate(sku)

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">商品が見つかりませんでした</p>
      </div>
````

## データマッピング（シート → 商品詳細）
- 基本情報:
  - SKU: ルート引数
  - 商品名/ASIN/カテゴリ: 「商品マスタ」より `SKU→{商品名, ASIN}`、カテゴリは「商品状態」の `カテゴリ` を優先
  - 現在在庫: 「商品状態」の `現在在庫数`（なければ「商品別在庫日次集計」の末日 `在庫数`）
- 売上KPI:
  - 総売上: 「商品別売上集計」の `実質売上`
  - 注文件数: 同 `注文件数`
  - 販売数量: 同 `販売数量`
  - 原価: `総仕入れ原価（税抜）/販売数量` を丸め
  - 利益/利益率: `総税抜利益` / `利益率%`
- 価格/評価:
  - 販売価格: 「商品状態」の `販売表示価格`（税込のまま表示）
  - 評価/レビュー数: 当面は空/モックでも可（将来 Amazon API 等で拡張）
- 時系列:
  - 日次売上: 「商品別日次売上集計」から対象SKUの `売上日` 毎に `販売数量, 実質売上, 総税抜利益, 注文件数`
  - 在庫推移: 「商品別在庫日次集計」の対象SKU `日付`/`在庫数`
  - カート率: 「商品別カート取得率集計」は日次列がないため、30日列を一定値として系列化、もしくは将来拡張

## 必要API
- GET /api/gas/product/{sku}?from&to&grain
  - 応答: ProductDetailResponse（docs/APIスキーマ.md 参照）
  - series: revenueDaily, unitsDaily, stockDaily, buyboxRateDaily（任意）