## APIスキーマ v1（Next.js プロキシ経由 / GAS バックエンド）

本ドキュメントは `docs/画面設計書.md` の要件に基づく恒久的な API 仕様です。クライアントは必ず Next.js のサーバルート配下（`/app/api/gas/*`）を呼び出し、サーバは GAS Web App にプロキシします。

---

### 0. 共通仕様

- ベースURL（クライアント視点）: `/api/gas/*`
- 認証/認可: Google ログイン必須。`ALLOWED_EMAILS` に含まれない場合は 403。
- セキュリティ: `GAS_API_KEY` はサーバのみ保持。クライアントへ露出しない。
- キャッシュ/鮮度: サーバルートは `cache: 'no-store'`。GAS は ~120秒キャッシュ。ページ側で ISR+SWR を適用。
- 日付/粒度の共通クエリ:
  - `from`: `YYYY-MM-DD`（必須）
  - `to`: `YYYY-MM-DD`（必須, 両端含む）
  - `grain`: `day|week|month`（省略時 `day`）
- エラーモデル（統一）:
  - 形: `{ error: string, code?: string, _status?: number, hint?: string }`
  - サーバは `data._status>=400` を検出した場合に HTTP ステータスを合わせて返却
- 表記ルール:
  - 金額は原則 税抜 円（number）
  - 率は 0..1（小数）。UI 側で必要に応じて 100 倍して % 表示

型（TypeScript 表記）:

```ts
export type Grain = 'day' | 'week' | 'month';

export type DateRangeQuery = {
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
  grain?: Grain;
};

export type ApiError = { error: string; code?: string; _status?: number; hint?: string };

export type TimePoint = { date: string; value: number };

// 参照シート（ソース定義）
export type SheetSource =
  | '日次売上集計'
  | '商品別日次売上集計'
  | '商品別売上集計'
  | '商品別カート取得率集計'
  | '商品別在庫日次集計'
  | '全体在庫日次集計'
  | '商品状態'
  | '商品マスタ';
```

---

### 1. ダッシュボード

- エンドポイント: `GET /api/gas/dashboard`
- クエリ: `DateRangeQuery`
- 用途: KPIカード、複合トレンド、ランキング/ダイジェストのソース

レスポンス:

```ts
export type DashboardKPI = {
  revenue: number;                 // 総売上（税抜, ∑実質売上）
  orderCount: number;              // 注文件数（∑注文件数）
  shippedUnits: number;            // 出荷商品数（∑出荷商品数）
  aov: number;                     // 売上/注文件数（小数許容）
  buyboxRateWeighted: number;      // 加重平均カート取得率（0..1）
  totalStock: number;              // 期間末日の在庫合計
  totalRecommendedOrderQty: number;// 商品状態.推奨発注数 合計
  totalDemandForecast: number;     // 商品状態.需要予測 合計
};

export type DashboardSeries = {
  revenue?: TimePoint[];   // 売上（日/週/月に応じて集計）
  units?: TimePoint[];     // 販売数量
  buyboxRate?: TimePoint[];// カート取得率（0..1）
  stock?: TimePoint[];     // 全体在庫
};

export type DashboardResponse = { kpi: DashboardKPI; series?: Partial<DashboardSeries> } | ApiError;
```

実装ノート（ソース）:
- kpi.revenue/orderCount/shippedUnits/aov: 「日次売上集計」
- kpi.buyboxRateWeighted: 「商品マスタ」JOIN→「商品別カート取得率集計」
  - 近似: `平均カート取得率（30日）` と `総セッション数（30日）` を加重平均
- kpi.totalStock: 「全体在庫日次集計」（期間末日）
- kpi.totalRecommendedOrderQty/totalDemandForecast: 「商品状態」
- series.revenue/units: 「日次売上集計」を粒度集約
- series.stock: 「全体在庫日次集計」（粒度=末日値 or 平均, UI方針に合わせる）
- series.buyboxRate: 「商品別カート取得率集計」の 30日列を近似（将来、日次系列化）

---

### 2. 商品一覧

- エンドポイント: `GET /api/gas/products`
- クエリ: `DateRangeQuery` ＋ 任意: `q`（検索）, `category`, `sort`, `order=asc|desc`
  - 将来拡張: `page`, `pageSize`
- 用途: `/products` テーブル、フィルタ/ソート、CSVエクスポート元

レスポンス:

```ts
export type InventoryHealth = '良' | '注意' | '危険' | '不明' | string;

export type ProductListItem = {
  sku: string;
  name: string;
  asin: string;
  category: string;
  units: number;                 // 期間合計 販売数量
  revenue: number;               // 期間合計 売上
  buyboxRate: number;            // 加重平均カート率（0..1）
  stock: number;                 // 期間末日時点在庫
  // UI 用の派生値（サーバで提供推奨。なければクライアント計算でも可）
  avgDailyUnits?: number;        // = units / 期間日数
  doh?: number;                  // = stock / avgDailyUnits
  // 状態
  recommendedOrderQty: number;   // 商品状態.推奨発注数
  demandForecast: number;        // 商品状態.需要予測
  inventoryHealth: InventoryHealth;
};

export type ProductsResponse = { items: ProductListItem[] } | ApiError;
```

実装ノート（ソース）:
- ベース: 「商品別売上集計」
- 商品名/ASIN: 「商品マスタ」JOIN
- 在庫/健全性/推奨発注/需要予測: 「商品状態」JOIN（なければ「商品別在庫日次集計」の末日）

ソート/フィルタ仕様（推奨）:
- ソート: `revenue|units|buyboxRate|stock|doh|recommendedOrderQty|demandForecast`
- フィルタ: `category`, `inventoryHealth`, `hasRecommendation(=recommendedOrderQty>0)`, `demandGtStock`, `buyboxRateBand`, `revenueDeltaBand`

---

### 3. 商品詳細

- エンドポイント: `GET /api/gas/product/{sku}`
- クエリ: `DateRangeQuery`
- 用途: `/products/{sku}` のヘッダー、ミニKPI、チャート、明細

レスポンス:

```ts
export type ProductDetailKPI = {
  units: number;                 // 期間合計
  revenue: number;               // 期間合計
  buyboxRateWeighted?: number;   // 期間の加重平均（0..1, 任意）
  stockEnd?: number;             // 期間末日の在庫
  doh?: number;                  // 任意
  recommendedOrderQty: number;   // 商品状態
  demandForecast: number;        // 商品状態
};

export type ProductDetailSeries = {
  revenueDaily: TimePoint[];
  unitsDaily: TimePoint[];
  stockDaily: TimePoint[];
  buyboxRateDaily?: TimePoint[]; // 任意（可能であれば提供）
  demandForecastByGrain?: TimePoint[]; // 粒度に応じた合計/平均
  recommendedOrderQtyByGrain?: TimePoint[]; // 任意（一定値でも可）
};

export type ProductDetailResponse = {
  sku: string;
  name: string;
  asin: string;
  category: string;
  kpis: ProductDetailKPI;
  series: ProductDetailSeries;
} | ApiError;
```

実装ノート（ソース）:
- 基本情報: 「商品マスタ」（商品名/ASIN）、カテゴリは「商品状態」
- KPI: 「商品別売上集計」（売上/数量/注文件数/利益/利益率）、在庫は「商品状態」
- series.revenueDaily/unitsDaily: 「商品別日次売上集計」
- series.stockDaily: 「商品別在庫日次集計」
- series.buyboxRateDaily: 「商品別カート取得率集計」（30日列の近似 or 将来拡張）

---

### 4. アラート/発注提案

- エンドポイント: `GET /api/gas/alerts`
- クエリ: 任意 `from`, `to`（一部指標で必要）, `tab`（`ordering|inventory|performance|sales|state`）
- 用途: `/alerts` 各タブの一覧

レスポンス:

```ts
export type AlertSeverity = 'Critical' | 'Warning' | 'Info';
export type AlertType = 'Ordering' | 'Inventory' | 'Performance' | 'Sales' | 'State';

export type AlertItem = {
  sku: string;
  name?: string;
  type: AlertType;
  severity: AlertSeverity;
  metrics: {
    recommendedOrderQty?: number;
    demandForecast?: number;
    stockEnd?: number;
    doh?: number;
    buyboxDrop7dPt?: number; // 7日MAの下降幅（pt）
    zeroSalesStreakDays?: number;
    inventoryHealth?: InventoryHealth;
  };
  message?: string;      // 推奨や補足
  updatedAt?: string;    // YYYY-MM-DD
};

export type AlertsResponse = {
  items: AlertItem[];
} | ApiError;
```

実装ノート（ソース）:
- 在庫不足/欠品: 「商品状態」現在在庫数（<20 / =0）
- 低利益: 「商品別売上集計」総税抜利益<0 や 利益率% が一定未満
- 表示名: 「商品マスタ」

---

### 5. 検索サジェスト（新設）

- エンドポイント: `GET /api/gas/products/suggest`
- クエリ: `q`（必須, SKU/ASIN/商品名）, 任意 `limit`（既定 10）
- 用途: ヘッダーのインクリメンタルサジェスト

レスポンス:

```ts
export type ProductSuggest = { sku: string; asin: string; name: string; category?: string };
export type SuggestResponse = { items: ProductSuggest[] } | ApiError;
```

実装指針:
- 当面は `/api/gas/products` の結果をサーバ側でフィルタして応答してもよい。

---

### 6. エクスポート（推奨）

- エンドポイント: `GET /api/gas/products/export`
- クエリ: `DateRangeQuery` + テーブルのフィルタ/ソートと同等
- 応答: `text/csv`（UTF-8, ヘッダー行あり）

---

### 7. フィルタ/ソート仕様（一覧）

- フィルタ: `category`, `inventoryHealth`, `hasRecommendation(=recommendedOrderQty>0)`, `demandGtStock`, `buyboxRateBand`, `revenueDeltaBand`
- ソート: `revenue|units|buyboxRate|stock|doh|recommendedOrderQty|demandForecast`
- いずれもサーバ/クライアントどちらでも実現可。データ量に応じて段階的にサーバ側最適化。

---

### 8. フィールド由来マップ（簡易）

- 商品名: 商品マスタ.商品名
- ASIN: 商品マスタ.ASIN
- カート率: 商品別カート取得率集計.平均カート取得率（7日/30日）
- 在庫数: 商品状態.現在在庫数（なければ 商品別在庫日次集計 在庫数末日）
- 実質売上/販売数量/注文件数/利益: 商品別売上集計
- 日次売上系列: 商品別日次売上集計
- 全体在庫系列: 全体在庫日次集計

---

### 9. 例（抜粋）

ダッシュボードの例:

```http
GET /api/gas/dashboard?from=2025-09-01&to=2025-09-30&grain=day
```

レスポンス（抜粋）:

```json
{
  "kpi": {
    "revenue": 12345678,
    "orderCount": 3456,
    "shippedUnits": 6789,
    "aov": 3572.1,
    "buyboxRateWeighted": 0.812,
    "totalStock": 4210,
    "totalRecommendedOrderQty": 320,
    "totalDemandForecast": 980
  }
}
```

---

### 10. 既存実装との差分（要改修）

- `dashboard`: 現状 `series` を未提供 → 将来 `revenue/units/buyboxRate/stock` 系列を追加
- `products`: `doh/avgDailyUnits` をサーバ提供（なければクライアント計算で補完）
- `product/{sku}`: `buyboxRateDaily` と 需要/発注系列は未提供 → 追加推奨
- `alerts`: 種別/深刻度/指標の正規化を強化（`AlertItem` へ揃える）
- `suggest`/`export`: 新設ルート（サーバ側でフィルタ/CSV生成）

---

### 11. バージョニング/互換性

- 現行は v1。後方互換を維持しつつプロパティ追加で拡張。
- 破壊的変更が必要な場合は `/api/gas/v2/*` の新設で移行。

---

この仕様は `docs/画面設計書.md` の UI 要件（KPI/チャート/テーブル/アラート/検索）を満たすための最小〜推奨スキーマを定義します。実装は段階的に拡張し、本書に追従して更新してください。


