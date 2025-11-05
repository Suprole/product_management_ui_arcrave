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
  // デフォルトは過去30日間
  // 商品一覧など全期間が必要な場合は、呼び出し側で明示的に from を指定する
  var from = param.from || Utilities.formatDate(new Date(Date.now()-30*86400000), 'Asia/Tokyo', 'yyyy-MM-dd');
  var to   = param.to   || today_();
  var grain= (param.grain || 'day').toLowerCase();
  return { from: from, to: to, grain: grain, sku: param.sku || '' };
}
function guard_(e) {
  var token = e && e.parameter && e.parameter.key;
  var expected = PropertiesService.getScriptProperties().getProperty('APP_TOKEN');
  if (!expected || token !== expected) throw new Error('unauthorized');
}

// 日付正規化: シートに "YYYY/MM/DD", "YYYY-MM-DD", Date オブジェクトなどが混在しても
// すべて "yyyy-MM-dd" に統一して返す
function toYmd_(v) {
  if (!v && v !== 0) return '';
  var d = null;
  if (Object.prototype.toString.call(v) === '[object Date]') {
    if (!isNaN(v.getTime())) d = v;
  } else if (typeof v === 'number') {
    // シリアル/epochの可能性。epoch(ms)想定
    d = new Date(v);
  } else if (typeof v === 'string') {
    var s = v.trim();
    // 区切りをスラッシュに統一してからDate化
    s = s.replace(/\./g, '/').replace(/-/g, '/');
    d = new Date(s);
  }
  if (!d || isNaN(d.getTime())) return '';
  return Utilities.formatDate(d, 'Asia/Tokyo', 'yyyy-MM-dd');
}

function inRangeYmd_(ymd, from, to) {
  if (!ymd) return false;
  return (ymd >= from && ymd <= to);
}

function rangeInfoFromRows_(rows, dateKey) {
  var min = null, max = null, c = 0;
  rows.forEach(function(r){
    var y = toYmd_(r[dateKey]);
    if (!y) return;
    c++;
    if (!min || y < min) min = y;
    if (!max || y > max) max = y;
  });
  return { count: c, min: min, max: max };
}

// ============================================================
// 発注管理用ユーティリティ関数（Phase 1で追加）
// ============================================================

/**
 * 日付文字列をDateオブジェクトに変換
 * @param {string} str YYYY-MM-DD形式
 * @return {Date|null}
 */
function parseDate_(str) {
  if (!str) return null;
  var match = String(str).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
}

/**
 * DateオブジェクトをYYYY-MM-DD形式に変換
 * @param {Date} date
 * @return {string}
 */
function formatDate_(date) {
  if (!date || !(date instanceof Date)) return '';
  if (isNaN(date.getTime())) return '';
  return Utilities.formatDate(date, 'Asia/Tokyo', 'yyyy-MM-dd');
}

/**
 * DateオブジェクトをYYYY-MM-DD HH:MM:SS形式に変換
 * @param {Date} date
 * @return {string}
 */
function formatDateTime_(date) {
  if (!date || !(date instanceof Date)) return '';
  if (isNaN(date.getTime())) return '';
  return Utilities.formatDate(date, 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ss');
}

/**
 * 四捨五入
 * @param {number} value
 * @param {number} decimals 小数点以下桁数（デフォルト0）
 * @return {number}
 */
function round_(value, decimals) {
  decimals = decimals || 0;
  var factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}


