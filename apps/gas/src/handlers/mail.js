/**
 * メール送信API ハンドラ
 * Phase 3: 依頼メール・納品完了メール送信
 */

// ============================================================
// 依頼メール送信（befree宛）
// ============================================================

/**
 * 依頼メール送信（befree宛）
 * @param {Object} payload { poIds: string[] }
 * @return {Object}
 */
function sendRequestEmail_(payload) {
  if (!payload.poIds || !Array.isArray(payload.poIds) || payload.poIds.length === 0) {
    throw new Error('送信対象の発注IDが指定されていません');
  }
  
  // メールアドレスチェック
  if (!CONFIG.MAIL.BEFREE) {
    throw new Error('MAIL_BEFREEが設定されていません（Script Propertiesを確認してください）');
  }
  
  // 対象発注を取得（sup_依頼中のみ）
  var orders = getOrders_({ statuses: ['sup_依頼中'] });
  var targetOrders = orders.filter(function(o) {
    return payload.poIds.indexOf(o.po_id) >= 0;
  });
  
  if (targetOrders.length === 0) {
    throw new Error('送信対象の発注がありません（ステータス: sup_依頼中）');
  }
  
  // メール本文生成
  var today = today_();
  var subject = '【発注依頼】Suprole - ' + today + ' (' + targetOrders.length + '件)';
  var htmlBody = buildRequestEmailHtml_(targetOrders);
  
  // 送信
  try {
    MailApp.sendEmail({
      to: CONFIG.MAIL.BEFREE,
      subject: subject,
      htmlBody: htmlBody
    });
    
    Logger.log('依頼メール送信成功: ' + targetOrders.length + '件 → ' + CONFIG.MAIL.BEFREE);
    
  } catch (mailErr) {
    Logger.log('メール送信エラー: ' + mailErr.toString());
    throw new Error('メール送信に失敗しました: ' + mailErr.message);
  }
  
  return { success: true, sentCount: targetOrders.length };
}

/**
 * 依頼メールHTML生成
 * @param {Array} orders
 * @return {string}
 */
function buildRequestEmailHtml_(orders) {
  var html = '<html><head><meta charset="utf-8"></head><body style="font-family: sans-serif;">';
  html += '<h2>発注依頼</h2>';
  html += '<p>以下の商品について発注をお願いします。</p>';
  
  html += '<table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">';
  html += '<thead><tr style="background-color: #f0f0f0;">';
  html += '<th>発注ID</th>';
  html += '<th>ASIN</th>';
  html += '<th>商品コード</th>';
  html += '<th>商品名</th>';
  html += '<th style="text-align: right;">数量（個）</th>';
  html += '<th style="text-align: right;">単価</th>';
  html += '<th style="text-align: right;">合計額</th>';
  html += '<th>発注日</th>';
  html += '</tr></thead>';
  html += '<tbody>';
  
  var totalQuantity = 0;
  var totalAmount = 0;
  
  orders.forEach(function(o) {
    html += '<tr>';
    html += '<td>' + o.po_id + '</td>';
    html += '<td>' + o.asin + '</td>';
    html += '<td>' + o.productCode + '</td>';
    html += '<td>' + o.productName + '</td>';
    html += '<td style="text-align: right;">' + o.quantity + '</td>';
    html += '<td style="text-align: right;">¥' + formatNumber_(o.unitPrice) + '</td>';
    html += '<td style="text-align: right;">¥' + formatNumber_(o.subtotal) + '</td>';
    html += '<td>' + o.orderDate + '</td>';
    html += '</tr>';
    
    totalQuantity += o.quantity;
    totalAmount += o.subtotal;
  });
  
  html += '</tbody></table>';
  
  html += '<div style="margin-top: 20px; padding: 10px; background-color: #f9f9f9; border-left: 4px solid #3b82f6;">';
  html += '<p style="margin: 5px 0;"><strong>発注件数:</strong> ' + orders.length + '件</p>';
  html += '<p style="margin: 5px 0;"><strong>合計発注数:</strong> ' + totalQuantity + '個</p>';
  html += '<p style="margin: 5px 0;"><strong>合計発注額:</strong> ¥' + formatNumber_(totalAmount) + '（税抜）</p>';
  html += '</div>';
  
  html += '<hr style="margin-top: 30px;">';
  html += '<p style="font-size: 12px; color: #666;">このメールは発注管理システムから自動送信されています。</p>';
  html += '</body></html>';
  
  return html;
}

// ============================================================
// 納品完了メール送信（Suprole宛）
// ============================================================

/**
 * 納品完了メール送信（Suprole宛）
 * @param {Object} payload { poIds: string[] }
 * @return {Object}
 */
function sendDeliveryEmail_(payload) {
  if (!payload.poIds || !Array.isArray(payload.poIds) || payload.poIds.length === 0) {
    throw new Error('送信対象の発注IDが指定されていません');
  }
  
  // メールアドレスチェック
  if (!CONFIG.MAIL.SUPROLE) {
    throw new Error('MAIL_SUPROLEが設定されていません（Script Propertiesを確認してください）');
  }
  
  // 対象発注を取得（be_納品手続完了のみ）
  var orders = getOrders_({ statuses: ['be_納品手続完了'] });
  var targetOrders = orders.filter(function(o) {
    return payload.poIds.indexOf(o.po_id) >= 0;
  });
  
  if (targetOrders.length === 0) {
    throw new Error('送信対象の発注がありません（ステータス: be_納品手続完了）');
  }
  
  // メール本文生成
  var today = today_();
  var subject = '【納品手続完了】befree - ' + today + ' (' + targetOrders.length + '件)';
  var htmlBody = buildDeliveryEmailHtml_(targetOrders);
  
  // 送信
  try {
    MailApp.sendEmail({
      to: CONFIG.MAIL.SUPROLE,
      subject: subject,
      htmlBody: htmlBody
    });
    
    Logger.log('納品完了メール送信成功: ' + targetOrders.length + '件 → ' + CONFIG.MAIL.SUPROLE);
    
  } catch (mailErr) {
    Logger.log('メール送信エラー: ' + mailErr.toString());
    throw new Error('メール送信に失敗しました: ' + mailErr.message);
  }
  
  return { success: true, sentCount: targetOrders.length };
}

/**
 * 納品完了メールHTML生成
 * @param {Array} orders
 * @return {string}
 */
function buildDeliveryEmailHtml_(orders) {
  var html = '<html><head><meta charset="utf-8"></head><body style="font-family: sans-serif;">';
  html += '<h2>納品手続完了通知</h2>';
  html += '<p>以下の商品について納品手続きが完了しました。</p>';
  
  html += '<table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">';
  html += '<thead><tr style="background-color: #f0f0f0;">';
  html += '<th>発注ID</th>';
  html += '<th>ASIN</th>';
  html += '<th>商品コード</th>';
  html += '<th>商品名</th>';
  html += '<th style="text-align: right;">数量（個）</th>';
  html += '<th style="text-align: right;">単価</th>';
  html += '<th style="text-align: right;">合計額</th>';
  html += '<th style="text-align: center;">消費税率</th>';
  html += '<th>伝票No.</th>';
  html += '<th>到着予定日</th>';
  html += '</tr></thead>';
  html += '<tbody>';
  
  var totalQuantity = 0;
  var totalSubtotal = 0;
  var totalTax = 0;
  
  orders.forEach(function(o) {
    var tax = o.subtotal * o.taxRate;
    var taxRatePct = (o.taxRate * 100).toFixed(0) + '%';
    
    html += '<tr>';
    html += '<td>' + o.po_id + '</td>';
    html += '<td>' + o.asin + '</td>';
    html += '<td>' + o.productCode + '</td>';
    html += '<td>' + o.productName + '</td>';
    html += '<td style="text-align: right;">' + o.quantity + '</td>';
    html += '<td style="text-align: right;">¥' + formatNumber_(o.unitPrice) + '</td>';
    html += '<td style="text-align: right;">¥' + formatNumber_(o.subtotal) + '</td>';
    html += '<td style="text-align: center;">' + taxRatePct + '</td>';
    html += '<td>' + (o.invoiceNo || '-') + '</td>';
    html += '<td>' + (o.arrivalDate || '-') + '</td>';
    html += '</tr>';
    
    totalQuantity += o.quantity;
    totalSubtotal += o.subtotal;
    totalTax += tax;
  });
  
  html += '</tbody></table>';
  
  var totalWithTax = totalSubtotal + totalTax;
  
  html += '<div style="margin-top: 20px; padding: 10px; background-color: #f9f9f9; border-left: 4px solid #10b981;">';
  html += '<p style="margin: 5px 0;"><strong>発注件数:</strong> ' + orders.length + '件</p>';
  html += '<p style="margin: 5px 0;"><strong>合計数量:</strong> ' + totalQuantity + '個</p>';
  html += '<p style="margin: 5px 0;"><strong>税抜合計:</strong> ¥' + formatNumber_(totalSubtotal) + '</p>';
  html += '<p style="margin: 5px 0;"><strong>消費税:</strong> ¥' + formatNumber_(Math.round(totalTax)) + '</p>';
  html += '<p style="margin: 5px 0; font-size: 18px;"><strong>税込合計:</strong> ¥' + formatNumber_(Math.round(totalWithTax)) + '</p>';
  html += '</div>';
  
  html += '<hr style="margin-top: 30px;">';
  html += '<p style="font-size: 12px; color: #666;">このメールは発注管理システムから自動送信されています。</p>';
  html += '</body></html>';
  
  return html;
}

// ============================================================
// ユーティリティ
// ============================================================

/**
 * 数値を3桁区切りでフォーマット
 * @param {number} num
 * @return {string}
 */
function formatNumber_(num) {
  if (typeof num !== 'number') return '0';
  return num.toLocaleString('ja-JP');
}

// ============================================================
// ハンドラ
// ============================================================

/**
 * POSTハンドラ（依頼メール）
 */
function handleSendRequestEmail_(payload) {
  return json_(sendRequestEmail_(payload));
}

/**
 * POSTハンドラ（納品完了メール）
 */
function handleSendDeliveryEmail_(payload) {
  return json_(sendDeliveryEmail_(payload));
}

