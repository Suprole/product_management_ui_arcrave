/**
 * 発注管理システム 設定ファイル
 * 
 * 環境に応じてScript Propertiesで以下を設定してください:
 * - SPREADSHEET_ID: スプレッドシートID
 * - MAIL_SUPROLE: Suprole宛メールアドレス
 * - MAIL_BEFREE: befree宛メールアドレス
 * - APP_TOKEN: API認証キー（既存）
 */

var CONFIG = {
  // スプレッドシートID（Script Propertiesから取得）
  SPREADSHEET_ID: PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') || '',
  
  // シート名
  SHEETS: {
    // 既存シート（売上・在庫管理）
    DAILY_SALES: '日次売上集計',
    SKU_SALES_DAILY: '商品別日次売上集計',
    SKU_SALES: '商品別売上集計',
    BUYBOX_DAILY: '商品別カート取得率集計',
    STOCK_SKU_DAILY: '商品別在庫日次集計',
    STOCK_GLOBAL_DAILY: '全体在庫日次集計',
    PRODUCT_MASTER: '商品マスタ',
    PRODUCT_STATE: '商品状態',
    
    // 新規シート（発注管理）
    ORDERS: '発注管理',
    PURCHASE_MASTER: '仕入れマスタ'
  },
  
  // メール設定
  MAIL: {
    SUPROLE: PropertiesService.getScriptProperties().getProperty('MAIL_SUPROLE') || '',
    BEFREE: PropertiesService.getScriptProperties().getProperty('MAIL_BEFREE') || ''
  },
  
  // ページネーション設定
  PAGINATION: {
    ITEMS_PER_PAGE: 50
  },
  
  // ステータス遷移定義
  STATUS_TRANSITIONS: {
    '依頼中': ['営業倉庫', 'FBA', '返品'],
    '営業倉庫': ['FBA', '返品'],
    'FBA': [],
    '返品': []
  },
  
  // 有効なステータス一覧
  VALID_STATUSES: [
    '依頼中',
    '営業倉庫',
    'FBA',
    '返品'
  ]
};

/**
 * 設定の検証
 */
function validateConfig_() {
  var errors = [];
  
  if (!CONFIG.SPREADSHEET_ID) {
    errors.push('SPREADSHEET_IDが設定されていません');
  }
  
  if (!CONFIG.MAIL.SUPROLE) {
    Logger.log('警告: MAIL_SUPROLEが設定されていません（メール送信機能は使用できません）');
  }
  
  if (!CONFIG.MAIL.BEFREE) {
    Logger.log('警告: MAIL_BEFREEが設定されていません（メール送信機能は使用できません）');
  }
  
  if (errors.length > 0) {
    throw new Error('設定エラー: ' + errors.join(', '));
  }
  
  return true;
}

