# apps/gas/src/handlers/product.js

- **役割**: GAS スクリプト（シート読み取り/統合/ハンドラ）
- **備考**: Next.js サーバルートがプロキシし、GAS鍵はクライアントへ露出しない

- **セキュリティ**: 機密（GAS_API_KEY等）はサーバのみ参照。クライアントへ出さない。
- **キャッシュ**: GAS=120秒、UI=ISR+SWR の多層キャッシュを意識する。

---
<reference (first 20 lines)>

````
function handleProductBySku_(e) {
  var p = normalizeParams_(e.parameter || {});
  if (!p.sku) return json_({ error: 'sku required' }, 400);

  var sku = p.sku;
  var sales = readAll_('商品別日次売上集計').filter(function(r){ return String(r['SKU'])===sku && inRangeYmd_(toYmd_(r['売上日']), p.from, p.to); });
  var stock = readAll_('商品別在庫日次集計').filter(function(r){ return String(r['SKU'])===sku && inRangeYmd_(toYmd_(r['日付']), p.from, p.to); });

  var head = { sku: sku, units:0, revenue:0 };
  sales.forEach(function(r){ head.units+=num_(r['販売数量']); head.revenue+=num_(r['実質売上']); });
  var rows = [head];
  joinMaster_(rows);
  joinState_(rows);

  var out = {
    sku: sku, name: rows[0].name, asin: rows[0].asin, category: rows[0].category,
    kpis: {
      units: head.units, revenue: head.revenue,
      recommendedOrderQty: rows[0].recommendedOrderQty,
      demandForecast: rows[0].demandForecast
````
