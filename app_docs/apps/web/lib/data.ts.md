# apps/web/lib/data.ts

- **役割**: 汎用ユーティリティとモックデータ

- **セキュリティ**: 機密（GAS_API_KEY等）はサーバのみ参照。クライアントへ出さない。
- **キャッシュ**: GAS=120秒、UI=ISR+SWR の多層キャッシュを意識する。

---
<reference (first 20 lines)>

````
// Data parsing and aggregation functions

export interface DailySales {
  date: string
  orderCount: number
  totalSales: number
  totalProfit: number
  profitRate: number
}

export interface Product {
  sku: string
  productName: string // Added product name field
  orderCount: number
  salesQuantity: number
  totalSales: number
  totalProfit: number
  profitRate: number
  currentStock: number
  stockHealth?: string
````
