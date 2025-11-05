# apps/gas/src/sheets.js

- **役割**: GAS スクリプト（シート読み取り/統合/ハンドラ）

- **セキュリティ**: 機密（GAS_API_KEY等）はサーバのみ参照。クライアントへ出さない。
- **キャッシュ**: GAS=120秒、UI=ISR+SWR の多層キャッシュを意識する。

---
<reference (first 20 lines)>

````
// SS_ID は Script Properties に保存（SS_ID=<SpreadsheetId>）
var SH = {
  DAILY_SALES: '日次売上集計',
  SKU_SALES_DAILY: '商品別日次売上集計',
  BUYBOX_DAILY: 'カート取得率日次',
  STOCK_SKEW_DAILY: '商品別在庫日次集計',
  STOCK_GLOBAL_DAILY: '全体在庫日次集計',
  MASTER: '商品マスタ',
  STATE: '商品状態'
};

function open_() {
  var id = PropertiesService.getScriptProperties().getProperty('SS_ID');
  if (!id) throw new Error('SS_ID is not set in Script Properties');
  return SpreadsheetApp.openById(id);
}

function readAll_(sheetName) {
  var sh = open_().getSheetByName(sheetName);
  if (!sh) throw new Error('sheet not found: ' + sheetName);
````
