# apps/web/components/kpi-cards.tsx

- **役割**: 再利用可能なUIコンポーネント
- **KPI/チャート**: 色・指標の一貫性を維持。前処理はサーバ側、描画はクライアント。

- **セキュリティ**: 機密（GAS_API_KEY等）はサーバのみ参照。クライアントへ出さない。
- **キャッシュ**: GAS=120秒、UI=ISR+SWR の多層キャッシュを意識する。

---
<reference (first 20 lines)>

````

## データマッピング（シート → KPI）
- 売上金額 revenue: 「商品管理システム_v3 - 日次売上集計」の「実質売上」の合計
- 注文件数 orderCount: 同「注文件数」の合計
- 出荷商品数 shippedUnits: 同「出荷商品数」の合計
- 平均注文単価 aov: revenue / orderCount
- 加重平均カート率 buyboxRateWeighted:
  - 「商品マスタ」で SKU→ASIN を JOIN
  - 「商品別カート取得率集計」の「平均カート取得率（30日）」を基準に、可能なら「総セッション数（30日）」で加重
- 全体在庫 totalStock: 「全体在庫日次集計」の「在庫数」の期間末日時点
- 推奨発注合計 totalRecommendedOrderQty: 「商品状態」の「推奨発注数」の合計
- 需要予測合計 totalDemandForecast: 「商品状態」の「需要予測」の合計

注意:
- 粒度 day|week|month は日次から集約。
- 期間端点は両端含む（from〜to）。

## 必要API
- GET /api/gas/dashboard?from&to&grain
  - 応答: DashboardResponse（docs/APIスキーマ.md 参照）
  - 将来拡張: series に revenue|units|stock|buyboxRate を追加可
import { TrendingUp, TrendingDown, DollarSign, Package, ShoppingCart, Percent } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getSalesData, getInventoryData, getProductsData } from "@/lib/data"

export async function KPICards() {
  const salesData = await getSalesData()
  const inventoryData = await getInventoryData()
  const productsData = await getProductsData()

  // Calculate KPIs
  const totalSales = salesData.reduce((sum, day) => sum + day.totalSales, 0)
  const totalProfit = salesData.reduce((sum, day) => sum + day.totalProfit, 0)
  const profitRate = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0
  const currentInventoryValue = inventoryData[inventoryData.length - 1]?.inventoryValue || 0
  const activeProducts = productsData.filter((p) => p.currentStock > 0).length
  const lowStockProducts = productsData.filter((p) => p.stockHealth === "不足").length

  const kpis = [
    {
      title: "総売上",
````
