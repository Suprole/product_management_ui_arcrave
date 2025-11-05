# apps/web/components/inventory-chart.tsx

- **役割**: 再利用可能なUIコンポーネント
- **KPI/チャート**: 色・指標の一貫性を維持。前処理はサーバ側、描画はクライアント。

- **セキュリティ**: 機密（GAS_API_KEY等）はサーバのみ参照。クライアントへ出さない。
- **キャッシュ**: GAS=120秒、UI=ISR+SWR の多層キャッシュを意識する。

---
<reference (first 20 lines)>

````
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

// Mock data - last 30 days
const mockData = [
  { date: "09/20", value: 2042 },
  { date: "09/21", value: 2044 },
  { date: "09/22", value: 2032 },
  { date: "09/23", value: 2030 },
  { date: "09/24", value: 2026 },
  { date: "09/25", value: 2028 },
  { date: "09/26", value: 2025 },
  { date: "09/27", value: 2031 },
  { date: "09/28", value: 2033 },
  { date: "09/29", value: 2010 },
  { date: "09/30", value: 2012 },
  { date: "10/01", value: 2018 },
  { date: "10/02", value: 2009 },
````

## データマッピング（シート → 在庫推移）
- X軸: 「全体在庫日次集計」の「日付」
- value: 同「在庫数」

集約:
- 粒度 week/month の場合は期間末日の在庫または平均在庫を表示（UI要件に合わせ選択）。既定は末日値。

## 必要API
- GET /api/gas/dashboard?from&to&grain
  - 応答: DashboardResponse.series.stock に TimePoint[]