# apps/web/components/sales-chart.tsx

- **役割**: 再利用可能なUIコンポーネント
- **KPI/チャート**: 色・指標の一貫性を維持。前処理はサーバ側、描画はクライアント。

- **セキュリティ**: 機密（GAS_API_KEY等）はサーバのみ参照。クライアントへ出さない。
- **キャッシュ**: GAS=120秒、UI=ISR+SWR の多層キャッシュを意識する。

---
<reference (first 20 lines)>

````
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { useMemo } from "react"

// Mock data - in real app, this would come from props or API
const mockData = [
  { date: "10/01", sales: 65306, profit: 6034 },
  { date: "10/02", sales: 25452, profit: 2080 },
  { date: "10/03", sales: 22818, profit: 2292 },
  { date: "10/04", sales: 100974, profit: 8817 },
  { date: "10/05", sales: 54990, profit: 2498 },
  { date: "10/06", sales: 39773, profit: 1920 },
  { date: "10/07", sales: 80541, profit: 3964 },
  { date: "10/08", sales: 63720, profit: 3006 },
  { date: "10/09", sales: 29617, profit: 3293 },
  { date: "10/10", sales: 62943, profit: 6224 },
  { date: "10/11", sales: 47643, profit: 5198 },
  { date: "10/12", sales: 24083, profit: 4839 },
````

## データマッピング（シート → 売上/利益推移）
- X軸: 「日次売上集計」の「売上日」を YYYY-MM-DD で整形
- sales: 同「実質売上」
- profit: 同「総税抜利益」

集約:
- 粒度が week/month の場合は日次から合計（profit は合計）

## 必要API
- GET /api/gas/dashboard?from&to&grain
  - 応答: DashboardResponse.series に revenue（sales）と任意で利益系列を追加