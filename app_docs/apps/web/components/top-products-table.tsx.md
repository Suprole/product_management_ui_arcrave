# apps/web/components/top-products-table.tsx

- **役割**: 再利用可能なUIコンポーネント
- **KPI/チャート**: 色・指標の一貫性を維持。前処理はサーバ側、描画はクライアント。

- **セキュリティ**: 機密（GAS_API_KEY等）はサーバのみ参照。クライアントへ出さない。
- **キャッシュ**: GAS=120秒、UI=ISR+SWR の多層キャッシュを意識する。

---
<reference (first 20 lines)>

````
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { getProductsData } from "@/lib/data"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"
import Link from "next/link"

export async function TopProductsTable() {
  const products = await getProductsData()

  // Sort by profit and take top 10
  const topProducts = products.sort((a, b) => b.totalProfit - a.totalProfit).slice(0, 10)

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">トップ商品（利益順）</CardTitle>
        <p className="text-sm text-muted-foreground">利益が高い上位10商品</p>
      </CardHeader>
      <CardContent>
````

## データマッピング（シート → トップ商品）
- ベース: 「商品別売上集計」
- JOIN: 「商品マスタ」で商品名（商品名）、ASIN を付与
- 表示列:
  - 商品名: 商品マスタ.商品名
  - SKU: 商品別売上集計.SKU
  - 利益: 商品別売上集計.総税抜利益
  - 売上: 商品別売上集計.実質売上
  - 販売数量: 商品別売上集計.販売数量
  - 在庫状態: 「商品状態」の在庫健全性（任意）
- 並び順: 利益降順で上位10件

## 必要API
- GET /api/gas/products?from&to&grain
  - 応答: ProductsResponse.items に必要フィールド（docs/APIスキーマ.md 参照）