# apps/gas/src/handlers/products.js

- **役割**: GAS スクリプト（シート読み取り/統合/ハンドラ）
- **備考**: Next.js サーバルートがプロキシし、GAS鍵はクライアントへ露出しない

- **セキュリティ**: 機密（GAS_API_KEY等）はサーバのみ参照。クライアントへ出さない。
- **キャッシュ**: GAS=120秒、UI=ISR+SWR の多層キャッシュを意識する。

---
<reference (first 20 lines)>

````
function handleProducts_(e) {
  var p = normalizeParams_(e.parameter || {});
  var key = 'products:' + p.from + ':' + p.to + ':' + p.grain;
  var debug = String(e && e.parameter && e.parameter.debug || '') === '1';
  var hit = !debug && cacheGet_(key);
  if (hit) return json_(JSON.parse(hit));

  var sales = readAll_('商品別日次売上集計')
    .filter(function(r){ var y = toYmd_(r['売上日']); return inRangeYmd_(y, p.from, p.to); });

  var agg = {}; // SKU単位に集計
  sales.forEach(function(r){
    var sku = String(r['SKU'] || '');
    if (!sku) return;
    if (!agg[sku]) agg[sku] = { sku: sku, units:0, revenue:0 };
    agg[sku].units   += num_(r['販売数量']);
    agg[sku].revenue += num_(r['実質売上']);
  });

  var rows = Object.keys(agg).map(function(k){ return agg[k]; });
````
