/**
 * 商品API ハンドラ
 * - 既存の商品一覧API（handleProducts_）
 * - Phase 4: 商品検索・マスタ結合ビュー（発注作成用）
 */

// ============================================================
// 既存の商品一覧API
// ============================================================

/**
 * 商品一覧取得（既存API）
 */
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
    if (!agg[sku]) agg[sku] = { sku: sku, units:0, revenue:0, orders:0, profit:0 };
    agg[sku].units   += num_(r['販売数量']);
    agg[sku].revenue += num_(r['実質売上']);
    agg[sku].orders  += num_(r['注文件数']);
    // 利益は税抜ベースを採用（総税抜利益）
    agg[sku].profit  += num_(r['総税抜利益']);
  });

  var rows = Object.keys(agg).map(function(k){ return agg[k]; });
  // 利益率（%）を付与（売上0のときは0）
  rows.forEach(function(x){ x.profitRate = x.revenue ? (x.profit / x.revenue * 100) : 0; });
  joinMaster_(rows);
  joinState_(rows);

  // 在庫は商品状態の「現在在庫数」を優先
  // joinState_ で currentStock が付与済み
  rows.forEach(function(x){ x.stock = typeof x.currentStock === 'number' ? x.currentStock : 0; });

  // カート率（ASINベース → マスタでSKUへ）：シンプルな加重平均（日次）
  // 週/月の集計表が与えられている前提につき『商品別カート取得率集計』を参照
  var buybox = readAll_('商品別カート取得率集計');
  // 列: ASIN, 平均カート取得率（7日 or 30日 or 全期間）, 総セッション数（7日 or 30日）等
  // 重みには『総セッション数（30日）』を採用し、値は『平均カート取得率（30日）』を採用
  var asinBySku = {};
  rows.forEach(function(x){ asinBySku[x.sku] = x.asin; });
  var acc = {};
  buybox.forEach(function(r){
    var asin = String(r['ASIN'] || '');
    var sku = Object.keys(asinBySku).find(function(s){ return asinBySku[s]===asin; });
    if (!sku) return;
    if (!acc[sku]) acc[sku] = { w:0, v:0 };
    var rate = num_(r['平均カート取得率（30日）']);
    var sess = num_(r['総セッション数（30日）']);
    acc[sku].w += sess;
    acc[sku].v += rate * sess;
  });
  rows.forEach(function(x){
    var a = acc[x.sku];
    x.buyboxRate = a && a.w ? (a.v / a.w) : 0;
  });

  // 平均日販・DOH（在庫日数）を追加
  var days = (new Date(p.to).getTime() - new Date(p.from).getTime()) / 86400000 + 1;
  rows.forEach(function(x){
    var avg = days > 0 ? (x.units / days) : 0;
    x.avgDailyUnits = avg;
    x.doh = avg > 0 ? (x.stock / avg) : null;
  });

  var out = { items: rows };
  if (debug) {
    try {
      var ds = readAll_('商品別日次売上集計');
      var st = readAll_('商品別在庫日次集計');
      var bb = readAll_('商品別カート取得率集計');
      out._debug = {
        params: p,
        salesDaily: rangeInfoFromRows_(ds, '売上日'),
        stockDaily: rangeInfoFromRows_(st, '日付'),
        buyboxAgg: { count: bb.length }
      };
    } catch (err) {
      out._debugError = String(err);
    }
  }
  if (!debug) cachePut_(key, JSON.stringify(out), 120);
  return json_(out);
}

// ============================================================
// 商品検索（発注作成用）
// ============================================================

/**
 * 商品検索（発注作成用）
 * @param {Object} filters { asin?, productCode?, namePart?, sku?, brand? }
 * @return {Array<Object>}
 */
function searchProducts_(filters) {
  filters = filters || {};
  
  // 商品マスタ取得
  var productSheet = openProductMasterSheet_();
  var products = readSheetAsObjects_(productSheet);
  
  // 仕入れマスタ取得
  var purchaseSheet = openPurchaseMasterSheet_();
  var purchases = readSheetAsObjects_(purchaseSheet);
  var purchaseMap = {};
  purchases.forEach(function(p) {
    var asin = String(p.ASIN || '');
    if (asin) {
      purchaseMap[asin] = p;
    }
  });
  
  // フィルタ適用
  var results = products.filter(function(p) {
    // 表示/非表示チェック（表示ONのみ）
    var visible = p['表示/非表示'];
    if (visible !== true && visible !== 'TRUE' && String(visible).toLowerCase() !== 'true') {
      return false;
    }
    
    // SKUフィルタ
    if (filters.sku && String(p.SKU || '') !== filters.sku) {
      return false;
    }
    
    // ASINフィルタ
    if (filters.asin && String(p.ASIN || '') !== filters.asin) {
      return false;
    }
    
    // 商品コードフィルタ
    if (filters.productCode && String(p['商品コード'] || '') !== filters.productCode) {
      return false;
    }
    
    // 商品名部分一致フィルタ
    if (filters.namePart) {
      var keyword = String(filters.namePart).toLowerCase();
      var name = String(p['商品名'] || '').toLowerCase();
      if (name.indexOf(keyword) === -1) {
        return false;
      }
    }
    
    // ブランドフィルタ
    if (filters.brand && String(p['ブランド'] || '') !== filters.brand) {
      return false;
    }
    
    return true;
  });
  
  // 仕入れマスタと結合
  results = results.map(function(p) {
    var asin = String(p.ASIN || '');
    var purchase = purchaseMap[asin] || {};
    
    return {
      sku: String(p.SKU || ''),
      asin: asin,
      productCode: String(p['商品コード'] || ''),
      name: String(p['商品名'] || ''),
      brand: String(p['ブランド'] || ''),
      // 仕入れマスタの情報
      setSize: num_(purchase['セット個数']) || 1,
      minLot: num_(purchase['最小ロット']) || 1,
      purchasePrice: num_(purchase['仕入れ値（税抜/セット）']) || 0,
      hazard: purchase['危険物'] === true || purchase['危険物'] === 'TRUE' || String(purchase['危険物']).toLowerCase() === 'true',
      hasExpiry: purchase['消費期限要'] === true || purchase['消費期限要'] === 'TRUE' || String(purchase['消費期限要']).toLowerCase() === 'true',
      // 計算値
      unitPrice: purchase['仕入れ値（税抜/セット）'] && purchase['セット個数'] ? 
        round_(num_(purchase['仕入れ値（税抜/セット）']) / num_(purchase['セット個数']), 2) : 0
    };
  });
  
  // 商品名でソート（昇順）
  results.sort(function(a, b) {
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
    return 0;
  });
  
  return results;
}

/**
 * GETハンドラ（商品検索）
 */
function handleSearchProducts_(e) {
  var p = e.parameter || {};
  
  var filters = {
    sku: p.sku || null,
    asin: p.asin || null,
    productCode: p.productCode || null,
    namePart: p.q || p.namePart || null,
    brand: p.brand || null
  };
  
  var results = searchProducts_(filters);
  
  // 件数制限（オプション）
  var limit = p.limit ? parseInt(p.limit, 10) : 0;
  if (limit > 0 && results.length > limit) {
    results = results.slice(0, limit);
  }
  
  return json_({ items: results, total: results.length });
}

// ============================================================
// マスタ結合ビュー
// ============================================================

/**
 * マスタ結合ビュー取得
 * @param {Object} filters
 * @return {Array<Object>}
 */
function getMasterView_(filters) {
  // searchProducts_と同じロジックを使用
  return searchProducts_(filters);
}

/**
 * GETハンドラ（マスタ結合ビュー）
 */
function handleGetMasterView_(e) {
  // searchProducts_と同じハンドラ
  return handleSearchProducts_(e);
}

// ============================================================
// 商品サジェスト（高速検索用）
// ============================================================

/**
 * 商品サジェスト（インクリメンタル検索用）
 * @param {string} query 検索クエリ
 * @param {number} limit 最大件数（デフォルト10）
 * @return {Array<Object>}
 */
function suggestProducts_(query, limit) {
  limit = limit || 10;
  
  if (!query || String(query).length < 2) {
    return [];
  }
  
  var keyword = String(query).toLowerCase();
  
  // 商品マスタから検索
  var productSheet = openProductMasterSheet_();
  var products = readSheetAsObjects_(productSheet);
  
  var results = [];
  
  for (var i = 0; i < products.length && results.length < limit; i++) {
    var p = products[i];
    
    // 表示ONのみ
    var visible = p['表示/非表示'];
    if (visible !== true && visible !== 'TRUE' && String(visible).toLowerCase() !== 'true') {
      continue;
    }
    
    var sku = String(p.SKU || '').toLowerCase();
    var asin = String(p.ASIN || '').toLowerCase();
    var name = String(p['商品名'] || '').toLowerCase();
    var code = String(p['商品コード'] || '').toLowerCase();
    
    // 部分一致チェック
    if (sku.indexOf(keyword) >= 0 || 
        asin.indexOf(keyword) >= 0 || 
        name.indexOf(keyword) >= 0 || 
        code.indexOf(keyword) >= 0) {
      
      results.push({
        sku: String(p.SKU || ''),
        asin: String(p.ASIN || ''),
        productCode: String(p['商品コード'] || ''),
        name: String(p['商品名'] || ''),
        brand: String(p['ブランド'] || '')
      });
    }
  }
  
  return results;
}

/**
 * GETハンドラ（商品サジェスト）
 */
function handleSuggestProducts_(e) {
  var p = e.parameter || {};
  var query = p.q || '';
  var limit = p.limit ? parseInt(p.limit, 10) : 10;
  
  var results = suggestProducts_(query, limit);
  
  return json_({ items: results, total: results.length });
}
