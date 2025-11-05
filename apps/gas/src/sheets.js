// SS_ID は Script Properties に保存（SS_ID=<SpreadsheetId>）
// SPREADSHEET_IDも同様に保存（発注管理用）
var SH = {
  DAILY_SALES: '日次売上集計',
  SKU_SALES_DAILY: '商品別日次売上集計',
  BUYBOX_DAILY: 'カート取得率日次',
  STOCK_SKEW_DAILY: '商品別在庫日次集計',
  STOCK_GLOBAL_DAILY: '全体在庫日次集計',
  MASTER: '商品マスタ',
  STATE: '商品状態',
  // 発注管理用シート
  ORDERS: '発注管理',
  PURCHASE_MASTER: '仕入れマスタ'
};

function open_() {
  var id = PropertiesService.getScriptProperties().getProperty('SS_ID');
  if (!id) throw new Error('SS_ID is not set in Script Properties');
  return SpreadsheetApp.openById(id);
}

function readAll_(sheetName) {
  var sh = open_().getSheetByName(sheetName);
  if (!sh) throw new Error('sheet not found: ' + sheetName);
  var values = sh.getDataRange().getValues();
  if (!values || !values.length) return [];
  var head = values.shift();
  return values.map(function(row){
    var o = {};
    for (var i=0;i<head.length;i++) o[String(head[i])] = row[i];
    return o;
  });
}

function readDashboard_(from, to) {
  var sales = readAll_(SH.DAILY_SALES).filter(function(r){
    var y = toYmd_(r['売上日']);
    return inRangeYmd_(y, from, to);
  });
  var res = {
    revenue: sales.reduce(function(a,r){ return a + num_(r['実質売上']); }, 0),
    orders:  sales.reduce(function(a,r){ return a + num_(r['注文件数']); }, 0),
    units:   sales.reduce(function(a,r){ return a + num_(r['出荷商品数']); }, 0),
    profit:  sales.reduce(function(a,r){ return a + num_(r['総税抜利益']); }, 0)
  };
  // 利益率
  res.profitRate = res.revenue ? (res.profit / res.revenue * 100) : 0;
  // 在庫合計は「商品状態」の「現在在庫数」の合計とする
  var stateRows = readAll_(SH.STATE);
  res.stockTotal = stateRows.reduce(function(a,r){ return a + num_(r['現在在庫数']); }, 0);
  res.recommendedOrderTotal = stateRows.reduce(function(a,r){ return a + num_(r['推奨発注数']); }, 0);
  res.demandForecastTotal   = stateRows.reduce(function(a,r){ return a + num_(r['需要予測']); }, 0);
  // AOV
  res.aov = res.orders ? (res.revenue / res.orders) : 0;
  // 加重平均カート率（30日集計を重み付けに使用）
  try {
    var bb = readAll_(SH.BUYBOX_DAILY === 'カート取得率日次' ? '商品別カート取得率集計' : '商品別カート取得率集計');
    var w = 0, v = 0;
    bb.forEach(function(r){
      var rateRaw = num_(r['平均カート取得率（30日）']);
      // シートは%（0..100）または比率（0..1）が混在し得るため正規化
      var rate = rateRaw > 1 ? (rateRaw / 100) : rateRaw;
      if (rate < 0) rate = 0; if (rate > 1) rate = 1;
      var sess = num_(r['総セッション数（30日）']);
      if (!sess && !rate) return;
      w += sess;
      v += rate * sess;
    });
    res.buyboxRateWeighted = w ? (v / w) : 0;
  } catch (e) {
    res.buyboxRateWeighted = 0;
  }
  return res;
}

function joinMaster_(rowsBySku) {
  var master = readAll_(SH.MASTER);
  var bySku = {};
  master.forEach(function(r){ bySku[String(r['SKU'])] = r; });
  rowsBySku.forEach(function(x){
    var m = bySku[x.sku] || {};
    x.asin = m['ASIN'] || '';
    x.name = m['商品名'] || '';
    x.category = m['カテゴリ'] || '';
    x.rating = m['商品評価'] ? String(m['商品評価']) : null;
  });
  return rowsBySku;
}

function joinState_(rowsBySku) {
  var st = readAll_(SH.STATE);
  var bySku = {};
  st.forEach(function(r){
    bySku[String(r['SKU'])] = {
      currentStock: num_(r['現在在庫数']),
      category: String(r['カテゴリ'] || ''),
      salePrice: num_(r['販売実質価格']),
      cost: num_(r['仕入れ値（税抜）']),
      inventoryHealth: String(r['在庫健全性'] || ''),
      recommendedOrderQty: num_(r['推奨発注数']),
      demandForecast: num_(r['需要予測']),
      stateUpdatedAt: (r['更新日'] || r['更新日時'] || '')
    };
  });
  rowsBySku.forEach(function(x){
    var s = bySku[x.sku] || {};
    x.currentStock = typeof s.currentStock === 'number' ? s.currentStock : 0;
    // 商品状態のカテゴリ/価格/原価を優先して付与
    if (s.category) x.category = s.category;
    if (typeof s.salePrice === 'number') x.salePrice = s.salePrice;
    if (typeof s.cost === 'number') x.cost = s.cost;
    x.inventoryHealth = s.inventoryHealth || null;
    x.recommendedOrderQty = s.recommendedOrderQty || 0;
    x.demandForecast = s.demandForecast || 0;
    x.stateUpdatedAt = s.stateUpdatedAt || null;
  });
  return rowsBySku;
}

// ============================================================
// 発注管理用シートユーティリティ（Phase 1で追加）
// ============================================================

/**
 * 発注管理シートを開く
 */
function openOrdersSheet_() {
  var sheet = open_().getSheetByName(SH.ORDERS);
  if (!sheet) throw new Error('発注管理シートが見つかりません: ' + SH.ORDERS);
  return sheet;
}

/**
 * 商品マスタシートを開く
 */
function openProductMasterSheet_() {
  var sheet = open_().getSheetByName(SH.MASTER);
  if (!sheet) throw new Error('商品マスタシートが見つかりません: ' + SH.MASTER);
  return sheet;
}

/**
 * 仕入れマスタシートを開く
 */
function openPurchaseMasterSheet_() {
  var sheet = open_().getSheetByName(SH.PURCHASE_MASTER);
  if (!sheet) throw new Error('仕入れマスタシートが見つかりません: ' + SH.PURCHASE_MASTER);
  return sheet;
}

/**
 * シートの全データを列名付きオブジェクト配列で取得
 * readAll_と同じだが、明示的な名前で提供
 */
function readSheetAsObjects_(sheet) {
  var values = sheet.getDataRange().getValues();
  if (!values || values.length === 0) return [];
  
  var headers = values[0];
  var data = [];
  
  for (var i = 1; i < values.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      row[String(headers[j])] = values[i][j];
    }
    data.push(row);
  }
  
  return data;
}

/**
 * 商品マスタをマップで取得（発注管理用）
 */
function getProductMasterMap_() {
  var sheet = openProductMasterSheet_();
  var products = readSheetAsObjects_(sheet);
  var map = {};
  
  products.forEach(function(p) {
    var sku = String(p.SKU || '');
    if (sku) {
      map[sku] = {
        asin: String(p.ASIN || ''),
        productCode: String(p['商品コード'] || ''),
        name: String(p['商品名'] || ''),
        brand: String(p['ブランド'] || '')
      };
    }
  });
  
  return map;
}

/**
 * 仕入れマスタから情報取得
 */
function getPurchaseInfo_(asin) {
  var sheet = openPurchaseMasterSheet_();
  var data = readSheetAsObjects_(sheet);
  
  for (var i = 0; i < data.length; i++) {
    if (String(data[i].ASIN) === asin) {
      return {
        setSize: num_(data[i]['セット個数']) || 1,
        minLot: num_(data[i]['最小ロット']) || 1,
        purchasePrice: num_(data[i]['仕入れ値（税抜/セット）']) || 0,
        hazard: data[i]['危険物'] === true || data[i]['危険物'] === 'TRUE',
        hasExpiry: data[i]['消費期限要'] === true || data[i]['消費期限要'] === 'TRUE'
      };
    }
  }
  
  return null;
}


