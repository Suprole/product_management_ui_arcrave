# apps/web/components/product-inventory-chart.tsx

- **役割**: 商品詳細の在庫推移グラフ
- **KPI/チャート**: 色・指標の一貫性を維持。前処理はサーバ側、描画はクライアント。

- **セキュリティ**: 機密（GAS_API_KEY等）はサーバのみ参照。クライアントへ出さない。
- **キャッシュ**: GAS=120秒、UI=ISR+SWR の多層キャッシュを意識する。

## データマッピング
- 対象SKU: ルート引数 sku
- ソース: 「商品別在庫日次集計」
- X軸: 日付
- シリーズ: 在庫数

## 必要API
- GET /api/gas/product/{sku}?from&to&grain
  - 応答: ProductDetailResponse.series.stockDaily
