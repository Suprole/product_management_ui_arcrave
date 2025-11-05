# apps/web/components/alerts-panel.tsx

- **役割**: 再利用可能なUIコンポーネント
- **KPI/チャート**: 色・指標の一貫性を維持。前処理はサーバ側、描画はクライアント。

- **セキュリティ**: 機密（GAS_API_KEY等）はサーバのみ参照。クライアントへ出さない。
- **キャッシュ**: GAS=120秒、UI=ISR+SWR の多層キャッシュを意識する。

---
<reference (first 20 lines)>

````
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, TrendingDown, Package } from "lucide-react"
import { getProductsData } from "@/lib/data"

export async function AlertsPanel() {
  const products = await getProductsData()

  const lowStockProducts = products.filter((p) => p.stockHealth === "不足")
  const outOfStockProducts = products.filter((p) => p.stockHealth === "out_of_stock")
  const lowProfitProducts = products.filter((p) => p.profitRate < 0)

  const alerts = [
    {
      type: "warning",
      icon: AlertTriangle,
      title: "在庫不足",
      count: lowStockProducts.length,
      description: `${lowStockProducts.length}商品が在庫不足です`,
      color: "text-warning",
    },
````

## データマッピング（シート → アラート）
- 在庫不足: 「商品状態」の「現在在庫数」< 閾値（例: 20）
- 欠品: 「商品状態」の「現在在庫数」=0
- 低利益: 「商品別売上集計」の「総税抜利益」< 0 または 利益率% が一定未満
- 推奨発注: 「商品状態」の「推奨発注数」> 0（別タブに拡張可）
- 表示名称: 「商品マスタ」の「商品名」を JOIN

## 必要API
- GET /api/gas/alerts?from&to
  - 応答: AlertsResponse.items（docs/APIスキーマ.md 参照）