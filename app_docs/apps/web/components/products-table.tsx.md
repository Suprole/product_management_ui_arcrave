# apps/web/components/products-table.tsx

- **役割**: 再利用可能なUIコンポーネント
- **KPI/チャート**: 色・指標の一貫性を維持。前処理はサーバ側、描画はクライアント。

- **セキュリティ**: 機密（GAS_API_KEY等）はサーバのみ参照。クライアントへ出さない。
- **キャッシュ**: GAS=120秒、UI=ISR+SWR の多層キャッシュを意識する。

---
<reference (first 20 lines)>

````
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, ArrowUpDown } from "lucide-react"
import { getProductsData, type Product } from "@/lib/data"
import Link from "next/link"

export function ProductsTable() {
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<string>("totalProfit")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  useEffect(() => {
    getProductsData().then(setProducts)
````

## データマッピング（シート → 一覧テーブル）
- ベース: 「商品別売上集計」
- JOIN: 「商品マスタ」で商品名/ASIN を付与
- さらに JOIN: 「商品状態」で現在在庫数/在庫健全性/推奨発注数/需要予測

表示項目:
- SKU: 商品別売上集計.SKU
- 商品名: 商品マスタ.商品名
- 在庫: 商品状態.現在在庫数（なければ 商品別在庫日次集計 の末日「在庫数」にフォールバック）
- 売上: 商品別売上集計.実質売上
- 利益: 商品別売上集計.総税抜利益
- 利益率: 商品別売上集計.利益率%
- 注文数: 商品別売上集計.注文件数
- 状態: 在庫バッジは 現在在庫数 に基づき `=0:在庫切れ`, `<20:在庫不足`, `>=20:正常`

並び替え:
- `totalSales|totalProfit|profitRate|orderCount|currentStock` に対応

## 必要API
- GET /api/gas/products?from&to&grain&q&category&sort&order
  - 応答: ProductsResponse.items（docs/APIスキーマ.md 参照）