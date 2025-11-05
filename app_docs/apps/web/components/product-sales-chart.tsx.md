# apps/web/components/product-sales-chart.tsx

- **役割**: 再利用可能なUIコンポーネント
- **KPI/チャート**: 色・指標の一貫性を維持。前処理はサーバ側、描画はクライアント。

- **セキュリティ**: 機密（GAS_API_KEY等）はサーバのみ参照。クライアントへ出さない。
- **キャッシュ**: GAS=120秒、UI=ISR+SWR の多層キャッシュを意識する。

---
<reference (first 20 lines)>

````
// see component in apps/web/components/product-sales-chart.tsx
````

## データマッピング（シート → 日次売上）
- 対象SKU: ルート引数 sku
- ソース: 「商品別日次売上集計」
- X軸: 売上日（YYYY-MM-DD）
- シリーズ:
  - unitsDaily: 販売数量
  - revenueDaily: 実質売上
  - profitDaily: 総税抜利益（任意）

集約:
- 粒度 week/month の場合は合計値へ集約

## 必要API
- GET /api/gas/product/{sku}?from&to&grain
  - 応答: ProductDetailResponse.series.revenueDaily, unitsDaily
