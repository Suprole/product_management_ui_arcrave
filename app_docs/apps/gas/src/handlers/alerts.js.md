# apps/gas/src/handlers/alerts.js

- **役割**: GAS スクリプト（シート読み取り/統合/ハンドラ）
- **備考**: Next.js サーバルートがプロキシし、GAS鍵はクライアントへ露出しない

- **セキュリティ**: 機密（GAS_API_KEY等）はサーバのみ参照。クライアントへ出さない。
- **キャッシュ**: GAS=120秒、UI=ISR+SWR の多層キャッシュを意識する。

---
<reference (first 20 lines)>

````
function handleAlerts_(e) {
  var p = normalizeParams_(e.parameter || {});

  // 推奨発注（Ordering）
  var st = readAll_('商品状態');
  var ordering = st.filter(function(r){ return num_(r['推奨発注数'])>0; }).map(function(r){
    return {
      sku: String(r['SKU']),
      type: 'Ordering',
      severity: 'Warning',
      metrics: {
        recommendedOrderQty: num_(r['推奨発注数']),
        demandForecast: num_(r['需要予測']),
        inventoryHealth: String(r['在庫健全性'] || '')
      },
      updatedAt: String(r['更新日'] || r['更新日時'] || '')
    };
  });

  // 需要超過警戒（簡易版）：需要予測 >= 在庫末日 + 7日平均日販
````
