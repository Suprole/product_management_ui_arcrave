function handleProductBySku_(e) {
  var p = normalizeParams_(e.parameter || {});
  if (!p.sku) return json_({ error: 'sku required' }, 400);

  var sku = p.sku;
  var sales = readAll_('商品別日次売上集計').filter(function(r){ return String(r['SKU'])===sku && inRangeYmd_(toYmd_(r['売上日']), p.from, p.to); });
  var stock = readAll_('商品別在庫日次集計').filter(function(r){ return String(r['SKU'])===sku && inRangeYmd_(toYmd_(r['日付']), p.from, p.to); });

  var head = { sku: sku, units:0, revenue:0, profit:0 };
  sales.forEach(function(r){
    head.units+=num_(r['販売数量']);
    head.revenue+=num_(r['実質売上']);
    head.profit+=num_(r['総税抜利益']);
  });
  var rows = [head];
  joinMaster_(rows);
  joinState_(rows);

  var out = {
    sku: sku,
    name: rows[0].name,
    asin: rows[0].asin,
    category: rows[0].category, // will be overwritten by state if provided
    rating: rows[0].rating || null,
    periodFrom: p.from,
    periodTo: p.to,
    kpis: {
      units: head.units, revenue: head.revenue,
      recommendedOrderQty: rows[0].recommendedOrderQty,
      demandForecast: rows[0].demandForecast
    },
    series: {
      revenueDaily: sales.map(function(r){ return { date: r['売上日'], value: num_(r['実質売上']) }; }),
      unitsDaily:   sales.map(function(r){ return { date: r['売上日'], value: num_(r['販売数量']) }; }),
      stockDaily:   stock.map(function(r){ return { date: r['日付'],  value: num_(r['在庫数']) }; }),
      profitDaily:  sales.map(function(r){ return { date: r['売上日'], value: num_(r['総税抜利益']) }; })
    }
  };
  // 期間末日在庫とDOH
  try {
    var stockEndRow = stock.filter(function(r){ return toYmd_(r['日付'])===p.to; })[0];
    var stockEnd = stockEndRow ? num_(stockEndRow['在庫数']) : 0;
    var days = (new Date(p.to).getTime() - new Date(p.from).getTime()) / 86400000 + 1;
    var avg = days>0 ? (head.units / days) : 0;
    out.kpis.stockEnd = stockEnd;
    out.kpis.doh = avg>0 ? (stockEnd/avg) : null;
  } catch (e1) {}

  // カテゴリ/価格/原価/現在在庫（商品状態優先）
  try {
    out.category = rows[0].category || out.category;
    out.price = num_(rows[0].salePrice);
    out.cost  = num_(rows[0].cost);
    out.kpis.stockCurrent = num_(rows[0].currentStock);
  } catch (e3) {
    // no-op
  }

  // 利益・利益率
  out.totalProfit = head.profit;
  out.profitRate = head.revenue ? (head.profit / head.revenue * 100) : 0;

  // 1個あたり平均利益（商品別売上集計より）
  try {
    var sum = readAll_('商品別売上集計').find(function(r){ return String(r['SKU'])===sku; });
    if (sum) out.unitProfit = num_(sum['1個あたり平均利益']);
  } catch (e4) {}

  // カート率（ASINベースの 7日/30日/全期間）
  try {
    var bb = readAll_('商品別カート取得率集計');
    var asin = rows[0].asin;
    var row = bb.find(function(r){ return String(r['ASIN'])===asin; });
    if (row) {
      var r7  = num_(row['平均カート取得率（7日）']);
      var r30 = num_(row['平均カート取得率（30日）']);
      var rall= num_(row['平均カート取得率（全期間）']);
      // 正規化（0..1）
      function norm(x){ x = Number(x); return x>1 ? (x/100) : (x<0?0:(x>1?1:x)); }
      out.kpis.buybox7d = norm(r7);
      out.kpis.buybox30d = norm(r30);
      out.kpis.buyboxAll = norm(rall);
      // 互換フィールド
      out.kpis.buyboxRateWeighted = out.kpis.buybox30d;
      // 日次系列（近似）: 期間 from..to の各日に 30日値を採用
      var start = new Date(p.from);
      var end   = new Date(p.to);
      var arr = [];
      for (var d = new Date(start.getTime()); d.getTime() <= end.getTime(); d = new Date(d.getTime()+86400000)) {
        var y = Utilities.formatDate(d, 'Asia/Tokyo', 'yyyy-MM-dd');
        arr.push({ date: y, value: out.kpis.buybox30d });
      }
      out.series.buyboxRateDaily = arr;
    }
  } catch (e2) {}
  var debug = String(e && e.parameter && e.parameter.debug || '') === '1';
  if (debug) {
    out._debug = {
      params: p,
      salesCount: sales.length,
      stockCount: stock.length
    };
  }
  return json_(out);
}


