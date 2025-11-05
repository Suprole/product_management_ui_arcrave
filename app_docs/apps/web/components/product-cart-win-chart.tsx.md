# apps/web/components/product-cart-win-chart.tsx

- **役割**: 再利用可能なUIコンポーネント
- **KPI/チャート**: 色・指標の一貫性を維持。前処理はサーバ側、描画はクライアント。

- **セキュリティ**: 機密（GAS_API_KEY等）はサーバのみ参照。クライアントへ出さない。
- **キャッシュ**: GAS=120秒、UI=ISR+SWR の多層キャッシュを意識する。

---
<reference (first 20 lines)>

````
"use client"

import { Card } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { CartWinRate } from "@/lib/data"

export function ProductCartWinChart({ data }: { data: CartWinRate[] }) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">カート取得率推移</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="date"
            stroke="hsl(var(--muted-foreground))"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => value.split("/").slice(1).join("/")}
          />
          <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} domain={[0, 100]} />
````

## データマッピング（シート → カート取得率）
- 対象SKU: ルート引数 sku
- JOIN: 「商品マスタ」で ASIN を取得
- ソース: 「商品別カート取得率集計」
- シリーズ: cartWinRate（%）= `平均カート取得率（30日）` を時系列へ展開（当面一定値）。将来は日次系列化
- 付随メトリクス: sessions = `総セッション数（30日）`

## 必要API
- GET /api/gas/product/{sku}?from&to&grain
  - 応答: ProductDetailResponse.series.buyboxRateDaily（任意）