/**
 * 発注管理API ハンドラ
 * Phase 2: CRUD操作（作成・取得・更新・ステータス遷移）
 */

// ============================================================
// 発注ID生成
// ============================================================

/**
 * 発注ID生成（PO-YYYYMMDD-NNNN形式）
 * @return {string}
 */
function generatePoId_() {
  var today = new Date();
  var dateStr = Utilities.formatDate(today, 'Asia/Tokyo', 'yyyyMMdd');
  var prefix = 'PO-' + dateStr + '-';
  
  var sheet = openOrdersSheet_();
  var data = readSheetAsObjects_(sheet);
  
  // 今日の発注IDを抽出
  var todayOrders = data.filter(function(row) {
    var poId = String(row.po_id || '');
    return poId.indexOf(prefix) === 0;
  });
  
  // 最大連番を取得
  var maxSeq = 0;
  todayOrders.forEach(function(row) {
    var match = String(row.po_id).match(/-(\d{4})$/);
    if (match) {
      var seq = parseInt(match[1], 10);
      if (seq > maxSeq) maxSeq = seq;
    }
  });
  
  // 次の連番（4桁ゼロパディング）
  var nextSeq = maxSeq + 1;
  var seqStr = ('0000' + nextSeq).slice(-4);
  
  var newPoId = prefix + seqStr;
  
  Logger.log('発注ID生成: ' + newPoId);
  
  return newPoId;
}

// ============================================================
// 発注一覧取得
// ============================================================

/**
 * 発注一覧取得（フィルタ・ソート対応）
 * @param {Object} filters
 * @return {Array<Object>}
 */
function getOrders_(filters) {
  filters = filters || {};
  
  var sheet = openOrdersSheet_();
  var orders = readSheetAsObjects_(sheet);
  
  // 商品マスタと結合（商品名を付与）
  var productMap = getProductMasterMap_();
  
  orders = orders.map(function(order) {
    var sku = String(order.SKU || '');
    var product = productMap[sku] || {};
    
    return {
      po_id: String(order.po_id || ''),
      sku: sku,
      asin: String(order.ASIN || ''),
      productCode: String(order['商品コード'] || ''),
      productName: product.name || String(order['商品名'] || ''),
      brand: product.brand || '',
      orderDate: formatDate_(order['発注日']),
      seller: String(order['発注先セラー'] || ''),
      quantity: num_(order['発注数量（個）']),
      setCount: num_(order['セット数']),
      setSize: num_(order['セット個数']),
      unitPrice: num_(order['単価（税抜/個）']),
      subtotal: num_(order['税抜純売上高']),
      taxRate: num_(order['消費税率']),
      invoiceNo: String(order['伝票No.'] || ''),
      arrivalDate: formatDate_(order['到着予定日']),
      status: String(order['ステータス'] || ''),
      remarks: String(order['備考'] || ''),
      createdBy: String(order.created_by || ''),
      createdAt: formatDateTime_(order.created_at),
      lastUpdatedBy: String(order.last_updated_by || ''),
      lastUpdatedAt: formatDateTime_(order.last_updated_at)
    };
  });
  
  // フィルタ適用
  if (filters.po_id) {
    orders = orders.filter(function(o) { return o.po_id === filters.po_id; });
  }
  
  if (filters.statuses && filters.statuses.length > 0) {
    orders = orders.filter(function(o) { 
      return filters.statuses.indexOf(o.status) >= 0; 
    });
  }
  
  if (filters.sku) {
    orders = orders.filter(function(o) { return o.sku === filters.sku; });
  }
  
  if (filters.asin) {
    orders = orders.filter(function(o) { return o.asin === filters.asin; });
  }
  
  if (filters.seller) {
    orders = orders.filter(function(o) { return o.seller === filters.seller; });
  }
  
  if (filters.productName) {
    var keyword = String(filters.productName).toLowerCase();
    orders = orders.filter(function(o) { 
      return o.productName.toLowerCase().indexOf(keyword) >= 0; 
    });
  }
  
  if (filters.fromDate) {
    orders = orders.filter(function(o) { 
      return o.orderDate && o.orderDate >= filters.fromDate; 
    });
  }
  
  if (filters.toDate) {
    orders = orders.filter(function(o) { 
      return o.orderDate && o.orderDate <= filters.toDate; 
    });
  }
  
  // ソート（発注日降順がデフォルト）
  orders.sort(function(a, b) {
    if (!a.orderDate && !b.orderDate) return 0;
    if (!a.orderDate) return 1;
    if (!b.orderDate) return -1;
    if (a.orderDate > b.orderDate) return -1;
    if (a.orderDate < b.orderDate) return 1;
    return 0;
  });
  
  return orders;
}

/**
 * 発注詳細取得
 * @param {string} poId
 * @return {Object|null}
 */
function getOrderById_(poId) {
  var orders = getOrders_({ po_id: poId });
  return orders.length > 0 ? orders[0] : null;
}

/**
 * GETリクエストハンドラ（発注一覧）
 */
function handleGetOrders_(e) {
  var p = e.parameter || {};
  
  var filters = {
    po_id: p.po_id || null,
    statuses: p.statuses ? String(p.statuses).split(',') : null,
    sku: p.sku || null,
    asin: p.asin || null,
    seller: p.seller || null,
    productName: p.productName || null,
    fromDate: p.fromDate || null,
    toDate: p.toDate || null
  };
  
  var orders = getOrders_(filters);
  
  return json_({ items: orders, total: orders.length });
}

// ============================================================
// 発注作成
// ============================================================

/**
 * 発注作成
 * @param {Object} input
 * @return {Object}
 */
function createOrder_(input) {
  // バリデーション
  if (!input) throw new Error('入力データが空です');
  if (!input.sku) throw new Error('SKUは必須です');
  if (!input.setCount || input.setCount <= 0) {
    throw new Error('セット数は1以上を指定してください');
  }
  
  // 商品マスタから情報取得
  var productMap = getProductMasterMap_();
  var product = productMap[input.sku];
  if (!product) {
    throw new Error('商品マスタに存在しないSKUです: ' + input.sku);
  }
  
  // 仕入れマスタから情報取得
  var purchaseInfo = getPurchaseInfo_(product.asin);
  if (!purchaseInfo) {
    throw new Error('仕入れマスタに存在しないASINです: ' + product.asin);
  }
  
  // 最小ロットチェック
  if (purchaseInfo.minLot > 0) {
    var remainder = input.setCount % purchaseInfo.minLot;
    if (remainder !== 0) {
      throw new Error(
        'セット数は最小ロット(' + purchaseInfo.minLot + 
        ')の倍数で指定してください（現在: ' + input.setCount + '）'
      );
    }
  }
  
  // 計算
  var setSize = purchaseInfo.setSize;
  var unitPrice = round_(purchaseInfo.purchasePrice / setSize, 2);
  var quantity = input.setCount * setSize;
  var subtotal = round_(unitPrice * quantity, 2);
  var taxRate = input.taxRate !== undefined ? input.taxRate : 0.1;
  
  // po_id生成
  var poId = generatePoId_();
  
  // 発注日
  var now = new Date();
  var orderDate = input.orderDate ? parseDate_(input.orderDate) : now;
  if (!orderDate) orderDate = now;
  
  // 発注レコード作成（シート列順に合わせる）
  var orderRow = [
    poId,                              // po_id
    input.sku,                         // SKU
    product.asin,                      // ASIN
    product.productCode || '',         // 商品コード
    product.name || '',                // 商品名
    orderDate,                         // 発注日
    input.seller || 'Suprole',        // 発注先セラー
    quantity,                          // 発注数量（個）
    input.setCount,                    // セット数
    setSize,                           // セット個数
    unitPrice,                         // 単価（税抜/個）
    subtotal,                          // 税抜純売上高
    taxRate,                           // 消費税率
    '',                                // 伝票No.
    null,                              // 到着予定日
    'sup_依頼中',                      // ステータス
    input.remarks || '',               // 備考
    input.createdBy || '',             // created_by
    now,                               // created_at
    input.createdBy || '',             // last_updated_by
    now                                // last_updated_at
  ];
  
  // シートに追加
  var sheet = openOrdersSheet_();
  sheet.appendRow(orderRow);
  
  Logger.log('発注作成成功: ' + poId + ' (SKU: ' + input.sku + ', 数量: ' + quantity + '個)');
  
  return { success: true, po_id: poId };
}

/**
 * POSTハンドラ（発注作成）
 */
function handleCreateOrder_(payload) {
  return json_(createOrder_(payload));
}

// ============================================================
// 発注更新
// ============================================================

/**
 * 発注更新
 * @param {Object} payload
 * @return {Object}
 */
function updateOrder_(payload) {
  if (!payload.po_id) throw new Error('po_idは必須です');
  
  var sheet = openOrdersSheet_();
  var data = sheet.getDataRange().getValues();
  
  if (data.length === 0) {
    throw new Error('発注管理シートが空です');
  }
  
  var headers = data[0];
  
  // po_idの列インデックス取得
  var poIdColIndex = headers.indexOf('po_id');
  if (poIdColIndex === -1) {
    throw new Error('po_id列が見つかりません');
  }
  
  // 対象行を検索
  var targetRowIndex = -1;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][poIdColIndex]) === payload.po_id) {
      targetRowIndex = i + 1; // シート上の行番号（1-indexed）
      break;
    }
  }
  
  if (targetRowIndex === -1) {
    throw new Error('発注が見つかりません: ' + payload.po_id);
  }
  
  // 更新可能な項目のマップ
  var updates = {};
  
  if (payload.taxRate !== undefined) {
    updates['消費税率'] = payload.taxRate;
  }
  
  if (payload.invoiceNo !== undefined) {
    updates['伝票No.'] = payload.invoiceNo;
  }
  
  if (payload.arrivalDate !== undefined) {
    var arrivalDate = parseDate_(payload.arrivalDate);
    updates['到着予定日'] = arrivalDate;
  }
  
  if (payload.remarks !== undefined) {
    updates['備考'] = payload.remarks;
  }
  
  // 監査項目は常に更新
  updates['last_updated_by'] = payload.updatedBy || '';
  updates['last_updated_at'] = new Date();
  
  // 列ごとに更新
  for (var key in updates) {
    var colIndex = headers.indexOf(key);
    if (colIndex !== -1) {
      sheet.getRange(targetRowIndex, colIndex + 1).setValue(updates[key]);
    }
  }
  
  Logger.log('発注更新成功: ' + payload.po_id);
  
  return { success: true };
}

/**
 * POSTハンドラ（発注更新）
 */
function handleUpdateOrder_(payload) {
  return json_(updateOrder_(payload));
}

// ============================================================
// ステータス変更
// ============================================================

/**
 * ステータス変更
 * @param {Object} payload
 * @return {Object}
 */
function changeOrderStatus_(payload) {
  if (!payload.po_id) throw new Error('po_idは必須です');
  if (!payload.newStatus) throw new Error('newStatusは必須です');
  
  // 現在のステータス取得
  var order = getOrderById_(payload.po_id);
  if (!order) {
    throw new Error('発注が見つかりません: ' + payload.po_id);
  }
  
  var currentStatus = order.status;
  var newStatus = payload.newStatus;
  
  // 同じステータスへの変更は許可
  if (currentStatus === newStatus) {
    Logger.log('ステータス変更: 同じステータスのためスキップ (' + currentStatus + ')');
    return { success: true, message: 'no change' };
  }
  
  // 遷移制限なし：すべてのステータスへの変更を許可
  Logger.log('ステータス変更: ' + currentStatus + ' → ' + newStatus);
  
  // ステータス更新
  var sheet = openOrdersSheet_();
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  
  var poIdColIndex = headers.indexOf('po_id');
  var statusColIndex = headers.indexOf('ステータス');
  var updatedByColIndex = headers.indexOf('last_updated_by');
  var updatedAtColIndex = headers.indexOf('last_updated_at');
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][poIdColIndex]) === payload.po_id) {
      var rowIndex = i + 1;
      sheet.getRange(rowIndex, statusColIndex + 1).setValue(newStatus);
      sheet.getRange(rowIndex, updatedByColIndex + 1).setValue(payload.updatedBy || '');
      sheet.getRange(rowIndex, updatedAtColIndex + 1).setValue(new Date());
      break;
    }
  }
  
  Logger.log(
    'ステータス変更成功: ' + payload.po_id + 
    ' (' + currentStatus + ' → ' + newStatus + ')'
  );
  
  return { success: true, from: currentStatus, to: newStatus };
}

/**
 * POSTハンドラ（ステータス変更）
 */
function handleChangeStatus_(payload) {
  return json_(changeOrderStatus_(payload));
}

