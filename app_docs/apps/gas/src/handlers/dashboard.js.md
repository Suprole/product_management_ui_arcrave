# apps/gas/src/handlers/dashboard.js

- **役割**: GAS スクリプト（シート読み取り/統合/ハンドラ）
- **備考**: Next.js サーバルートがプロキシし、GAS鍵はクライアントへ露出しない

- **セキュリティ**: 機密（GAS_API_KEY等）はサーバのみ参照。クライアントへ出さない。
- **キャッシュ**: GAS=120秒、UI=ISR+SWR の多層キャッシュを意識する。

---
<reference (first 20 lines)>

````
function handleDashboard_(e) {
  var p = normalizeParams_(e.parameter || {});
  var key = 'dash:' + p.from + ':' + p.to + ':' + p.grain;
  var debug = String(e && e.parameter && e.parameter.debug || '') === '1';
  var hit = !debug && cacheGet_(key);
  if (hit) return json_(JSON.parse(hit));

  var kpi = readDashboard_(p.from, p.to);
  var out = { kpi: kpi, series: {} };

  // series（基本: 日次）。粒度集計はUI側で可能なため当面は日別を返す
  try {
    var salesDaily = readAll_('日次売上集計')
      .filter(function(r){ var y = toYmd_(r['売上日']); return inRangeYmd_(y, p.from, p.to); })
      .map(function(r){ return { date: toYmd_(r['売上日']), revenue: num_(r['実質売上']), units: num_(r['出荷商品数']) }; });
    out.series.revenue = salesDaily.map(function(x){ return { date: x.date, value: x.revenue }; });
    out.series.units   = salesDaily.map(function(x){ return { date: x.date, value: x.units }; });
  } catch (err) {
    out._seriesRevenueError = String(err);
  }
````
