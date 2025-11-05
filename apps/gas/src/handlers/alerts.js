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
  var to = p.to;
  var stock = readAll_('商品別在庫日次集計').filter(function(r){ return toYmd_(r['日付'])===to; });
  var stockMap = {};
  stock.forEach(function(r){ stockMap[String(r['SKU'])] = num_(r['在庫数']); });

  var from7 = Utilities.formatDate(new Date(new Date(to).getTime()-7*86400000), 'Asia/Tokyo', 'yyyy-MM-dd');
  var sales7 = readAll_('商品別日次売上集計').filter(function(r){ var y=toYmd_(r['売上日']); return (y<=to && y>from7); });
  var avg7 = {};
  sales7.forEach(function(r){ var s = String(r['SKU']); avg7[s] = (avg7[s]||0) + num_(r['販売数量']); });
  Object.keys(avg7).forEach(function(k){ avg7[k] = avg7[k]/7; });

  var needWarnSkus = st.filter(function(r){
    var sku = String(r['SKU']);
    var need = num_(r['需要予測']);
    var inv = stockMap[sku] || 0;
    var d7  = avg7[sku] || 0;
    return need >= (inv + 7*d7);
  }).map(function(r){ return String(r['SKU']); });
  var demand = needWarnSkus.map(function(sku){
    return { sku: sku, type: 'Inventory', severity: 'Warning', metrics: {}, message: '需要予測が在庫+7日平均を超過' };
  });

  return json_({ items: ordering.concat(demand), needWarnSkus: needWarnSkus });
}


