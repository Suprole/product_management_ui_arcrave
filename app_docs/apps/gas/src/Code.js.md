# apps/gas/src/Code.js

- **役割**: GAS スクリプト（シート読み取り/統合/ハンドラ）

- **セキュリティ**: 機密（GAS_API_KEY等）はサーバのみ参照。クライアントへ出さない。
- **キャッシュ**: GAS=120秒、UI=ISR+SWR の多層キャッシュを意識する。

---
<reference (first 20 lines)>

````
function doGet(e) {
  try {
    guard_(e); // ?key=APP_TOKEN チェック
    var p = (e && e.parameter && e.parameter.path) ? String(e.parameter.path).toLowerCase() : 'dashboard';
    if (p === 'dashboard') return handleDashboard_(e);
    if (p === 'products')  return handleProducts_(e);
    if (p === 'product')   return handleProductBySku_(e);
    if (p === 'alerts')    return handleAlerts_(e);
    return json_({ error: 'not found' }, 404);
  } catch (err) {
    return json_({ error: String(err) }, 500);
  }
}



````
