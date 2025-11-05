# apps/gas/src/util.js

- **役割**: GAS スクリプト（シート読み取り/統合/ハンドラ）

- **セキュリティ**: 機密（GAS_API_KEY等）はサーバのみ参照。クライアントへ出さない。
- **キャッシュ**: GAS=120秒、UI=ISR+SWR の多層キャッシュを意識する。

---
<reference (first 20 lines)>

````
function json_(obj, status) {
  obj = obj || {};
  if (status) obj._status = status;
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
function num_(v) { v = Number(v); return isNaN(v) ? 0 : v; }
function today_() { return Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd'); }
function cacheGet_(key) { return CacheService.getScriptCache().get(key); }
function cachePut_(key, value, seconds) { CacheService.getScriptCache().put(key, value, seconds || 60); }

function normalizeParams_(param) {
  var from = param.from || Utilities.formatDate(new Date(Date.now()-30*86400000), 'Asia/Tokyo', 'yyyy-MM-dd');
  var to   = param.to   || today_();
  var grain= (param.grain || 'day').toLowerCase();
  return { from: from, to: to, grain: grain, sku: param.sku || '' };
}
function guard_(e) {
  var token = e && e.parameter && e.parameter.key;
  var expected = PropertiesService.getScriptProperties().getProperty('APP_TOKEN');
  if (!expected || token !== expected) throw new Error('unauthorized');
````
