function doGet(e) {
  try {
    guard_(e); // ?key=APP_TOKEN チェック
    var p = (e && e.parameter && e.parameter.path) ? String(e.parameter.path).toLowerCase() : 'dashboard';
    
    // 既存の読取API
    if (p === 'dashboard') return handleDashboard_(e);
    if (p === 'products')  return handleProducts_(e);
    if (p === 'product')   return handleProductBySku_(e);
    if (p === 'alerts')    return handleAlerts_(e);
    
    // 発注管理API（GET）
    if (p === 'orders') return handleGetOrders_(e);
    if (p === 'searchproducts') return handleSearchProducts_(e);
    if (p === 'masterview') return handleGetMasterView_(e);
    
    return json_({ error: 'not found' }, 404);
  } catch (err) {
    Logger.log('doGet error: ' + err.toString());
    return json_({ error: String(err), stack: err.stack || '' }, 500);
  }
}

/**
 * POSTリクエスト処理（発注管理用）
 */
function doPost(e) {
  try {
    guard_(e); // 認証チェック
    
    var payload = {};
    try {
      payload = JSON.parse(e.postData.contents || '{}');
    } catch (parseErr) {
      throw new Error('Invalid JSON payload');
    }
    
    var action = e.parameter.action;
    
    if (!action) {
      throw new Error('action parameter is required');
    }
    
    Logger.log('doPost action: ' + action);
    
    // アクションルーティング
    if (action === 'createOrder') return handleCreateOrder_(payload);
    if (action === 'updateOrder') return handleUpdateOrder_(payload);
    if (action === 'changeStatus') return handleChangeStatus_(payload);
    if (action === 'sendRequestEmail') return handleSendRequestEmail_(payload);
    if (action === 'sendDeliveryEmail') return handleSendDeliveryEmail_(payload);
    
    return json_({ error: 'unknown action: ' + action }, 400);
    
  } catch (err) {
    Logger.log('doPost error: ' + err.toString());
    return json_({ error: String(err), stack: err.stack || '' }, 500);
  }
}

/**
 * PUT/DELETEのシミュレーション（GASはPOSTで処理）
 */
function doPut(e) {
  return doPost(e);
}

function doDelete(e) {
  return doPost(e);
}


