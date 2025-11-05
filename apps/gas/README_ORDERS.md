# 発注管理API - GAS実装ガイド

## 📋 実装済みファイル一覧

### ✅ Phase 1-4で追加・更新したファイル

```
apps/gas/src/
├── appsscript.json          [更新] スコープ追加
├── Code.js                   [更新] doPost()追加
├── config.js                 [新規] 設定ファイル
├── util.js                   [更新] ユーティリティ関数追加
├── sheets.js                 [更新] シートユーティリティ追加
└── handlers/
    ├── orders.js             [新規] 発注CRUD API
    ├── mail.js               [新規] メール送信API
    └── products.js           [新規] 商品・マスタ検索API
```

---

## 🚀 デプロイ手順

### ステップ1: Script Propertiesの設定

Google Apps Scriptエディタで、以下のプロパティを設定してください：

```
キー: SS_ID
値: [スプレッドシートID]

キー: APP_TOKEN
値: [API認証キー]（既存）

キー: MAIL_SUPROLE
値: [Suproleのメールアドレス]

キー: MAIL_BEFREE
値: [befreeのメールアドレス]
```

**設定方法**:
1. GASエディタで「プロジェクトの設定」（歯車アイコン）をクリック
2. 「スクリプト プロパティ」セクションで「スクリプト プロパティを編集」をクリック
3. 上記のキーと値を追加

### ステップ2: claspでプッシュ

```bash
cd apps/gas
pnpm push  # または clasp push
```

### ステップ3: 権限承認

初回デプロイ時に以下の権限承認が必要です：

- ✅ スプレッドシートへの読み書き権限
- ✅ メール送信権限

GASエディタで任意の関数を実行し、権限承認画面で「許可」をクリックしてください。

### ステップ4: Web Appとして再デプロイ

GASエディタで「デプロイ」→「新しいデプロイ」を実行してください。

---

## 🧪 動作確認テスト

### テスト関数の追加

GASエディタで以下のテスト関数を一時的に追加してください：

```javascript
/**
 * Phase 1-4 統合テスト
 */
function testOrderManagement() {
  try {
    Logger.log('=== 発注管理システム 動作確認テスト ===\n');
    
    // 1. 設定確認
    Logger.log('1. 設定確認');
    Logger.log('  SPREADSHEET_ID: ' + (CONFIG.SPREADSHEET_ID ? '✅ 設定済み' : '❌ 未設定'));
    Logger.log('  MAIL_SUPROLE: ' + (CONFIG.MAIL.SUPROLE ? '✅ 設定済み' : '⚠️ 未設定'));
    Logger.log('  MAIL_BEFREE: ' + (CONFIG.MAIL.BEFREE ? '✅ 設定済み' : '⚠️ 未設定'));
    
    // 2. シートアクセステスト
    Logger.log('\n2. シートアクセステスト');
    try {
      var productSheet = openProductMasterSheet_();
      Logger.log('  商品マスタシート: ✅ OK');
    } catch (e) {
      Logger.log('  商品マスタシート: ❌ ' + e.message);
    }
    
    try {
      var purchaseSheet = openPurchaseMasterSheet_();
      Logger.log('  仕入れマスタシート: ✅ OK');
    } catch (e) {
      Logger.log('  仕入れマスタシート: ❌ ' + e.message);
    }
    
    try {
      var ordersSheet = openOrdersSheet_();
      Logger.log('  発注管理シート: ✅ OK');
    } catch (e) {
      Logger.log('  発注管理シート: ❌ ' + e.message);
    }
    
    // 3. マスタ読み込みテスト
    Logger.log('\n3. マスタ読み込みテスト');
    var productMap = getProductMasterMap_();
    Logger.log('  商品マスタ件数: ' + Object.keys(productMap).length + '件');
    
    // 4. 商品検索テスト
    Logger.log('\n4. 商品検索テスト');
    var searchResults = searchProducts_({ namePart: '' });
    Logger.log('  検索結果: ' + searchResults.length + '件');
    if (searchResults.length > 0) {
      Logger.log('  サンプル: ' + searchResults[0].name);
    }
    
    // 5. 発注ID生成テスト
    Logger.log('\n5. 発注ID生成テスト');
    var poId = generatePoId_();
    Logger.log('  生成されたID: ' + poId);
    
    // 6. 発注一覧取得テスト
    Logger.log('\n6. 発注一覧取得テスト');
    var orders = getOrders_({});
    Logger.log('  既存発注件数: ' + orders.length + '件');
    
    // 7. ステータス遷移定義確認
    Logger.log('\n7. ステータス遷移定義');
    for (var status in CONFIG.STATUS_TRANSITIONS) {
      var transitions = CONFIG.STATUS_TRANSITIONS[status];
      Logger.log('  ' + status + ' → ' + transitions.join(', '));
    }
    
    Logger.log('\n✅ すべてのテスト完了！');
    Logger.log('\n次のステップ: 実際に発注を作成してテストしてください');
    
  } catch (err) {
    Logger.log('\n❌ エラー発生: ' + err.toString());
    Logger.log('スタック: ' + (err.stack || ''));
  }
}

/**
 * 発注作成テスト（実際にデータを作成します）
 * 注意: このテストは実際にスプレッドシートにデータを追加します
 */
function testCreateOrder() {
  try {
    Logger.log('=== 発注作成テスト ===\n');
    
    // まず商品を検索
    var products = searchProducts_({});
    if (products.length === 0) {
      Logger.log('❌ テスト用の商品が見つかりません');
      return;
    }
    
    var testProduct = products[0];
    Logger.log('テスト商品: ' + testProduct.name);
    Logger.log('SKU: ' + testProduct.sku);
    Logger.log('セット個数: ' + testProduct.setSize);
    Logger.log('最小ロット: ' + testProduct.minLot);
    Logger.log('仕入れ値: ' + testProduct.purchasePrice);
    
    // 発注作成
    var input = {
      sku: testProduct.sku,
      setCount: testProduct.minLot || 1,  // 最小ロット分を発注
      taxRate: 0.1,
      seller: 'Suprole',
      remarks: 'テスト発注',
      createdBy: 'test@example.com'
    };
    
    Logger.log('\n発注作成中...');
    var result = createOrder_(input);
    
    if (result.success) {
      Logger.log('✅ 発注作成成功！');
      Logger.log('発注ID: ' + result.po_id);
      
      // 作成した発注を取得
      var order = getOrderById_(result.po_id);
      if (order) {
        Logger.log('\n作成された発注の詳細:');
        Logger.log('  商品名: ' + order.productName);
        Logger.log('  数量: ' + order.quantity + '個');
        Logger.log('  単価: ¥' + order.unitPrice);
        Logger.log('  合計: ¥' + order.subtotal);
        Logger.log('  ステータス: ' + order.status);
      }
    }
    
  } catch (err) {
    Logger.log('❌ エラー: ' + err.toString());
    Logger.log('スタック: ' + (err.stack || ''));
  }
}
```

### テスト実行手順

1. GASエディタで `testOrderManagement()` を実行
2. ログを確認し、すべて ✅ になることを確認
3. （オプション）`testCreateOrder()` を実行して実際に発注を作成してテスト

---

## 📡 API一覧

### GET /exec?path=orders

発注一覧取得

**クエリパラメータ**:
- `po_id`: 発注ID（完全一致）
- `statuses`: ステータスのカンマ区切り（例: `sup_依頼中,be_メーカー取寄中`）
- `sku`: SKU（完全一致）
- `asin`: ASIN（完全一致）
- `seller`: 発注先セラー
- `productName`: 商品名（部分一致）
- `fromDate`: 発注日開始（YYYY-MM-DD）
- `toDate`: 発注日終了（YYYY-MM-DD）

**レスポンス例**:
```json
{
  "items": [
    {
      "po_id": "PO-20251102-0001",
      "sku": "00-KOU9-B1OP",
      "productName": "プラネットサーフ アイブロウ",
      "quantity": 12,
      "status": "sup_依頼中",
      ...
    }
  ],
  "total": 1
}
```

---

### POST /exec?action=createOrder

発注作成

**リクエストボディ**:
```json
{
  "sku": "00-KOU9-B1OP",
  "setCount": 2,
  "taxRate": 0.1,
  "seller": "Suprole",
  "remarks": "急ぎ対応",
  "createdBy": "user@example.com"
}
```

**レスポンス**:
```json
{
  "success": true,
  "po_id": "PO-20251102-0001"
}
```

---

### POST /exec?action=updateOrder

発注更新

**リクエストボディ**:
```json
{
  "po_id": "PO-20251102-0001",
  "taxRate": 0.1,
  "invoiceNo": "1234567890",
  "arrivalDate": "2025-11-10",
  "remarks": "更新テスト",
  "updatedBy": "user@example.com"
}
```

---

### POST /exec?action=changeStatus

ステータス変更

**リクエストボディ**:
```json
{
  "po_id": "PO-20251102-0001",
  "newStatus": "be_メーカー取寄中",
  "updatedBy": "user@example.com"
}
```

**ステータス遷移**:
- `sup_依頼中` → `be_メーカー取寄中`, `保留`, `返品`
- `be_メーカー取寄中` → `be_納品手続完了`, `保留`, `返品`
- `be_納品手続完了` → `sup_受取完了`, `保留`, `返品`
- `sup_受取完了` → `sup_fba出荷完了`, `保留`, `返品`
- `sup_fba出荷完了` → `保留`, `返品`
- `保留` → `保留`, `返品`
- `返品` → （遷移不可）

---

### POST /exec?action=sendRequestEmail

依頼メール送信（befree宛）

**リクエストボディ**:
```json
{
  "poIds": ["PO-20251102-0001", "PO-20251102-0002"]
}
```

**条件**: ステータスが `sup_依頼中` の発注のみ送信対象

---

### POST /exec?action=sendDeliveryEmail

納品完了メール送信（Suprole宛）

**リクエストボディ**:
```json
{
  "poIds": ["PO-20251102-0001", "PO-20251102-0002"]
}
```

**条件**: ステータスが `be_納品手続完了` の発注のみ送信対象

---

### GET /exec?path=searchproducts

商品検索

**クエリパラメータ**:
- `q`: 検索キーワード（商品名部分一致）
- `sku`: SKU（完全一致）
- `asin`: ASIN（完全一致）
- `productCode`: 商品コード（完全一致）
- `brand`: ブランド（完全一致）
- `limit`: 最大件数

**レスポンス**: 商品マスタ+仕入れマスタの結合データ

---

### GET /exec?path=masterview

マスタ結合ビュー取得

**内容**: `searchproducts` と同じ

---

## 🔧 トラブルシューティング

### エラー: `SS_ID is not set in Script Properties`

**原因**: Script Propertiesに `SS_ID` が設定されていません

**解決方法**:
1. GASエディタで「プロジェクトの設定」を開く
2. 「スクリプト プロパティ」セクションで `SS_ID` を追加
3. 値にスプレッドシートIDを設定

---

### エラー: `発注管理シートが見つかりません`

**原因**: スプレッドシートに「発注管理」シートが存在しません

**解決方法**:
1. スプレッドシートに「発注管理」シートを作成
2. ヘッダー行を正しく設定（20列）

---

### エラー: `unauthorized`

**原因**: API認証キー（`APP_TOKEN`）が一致しません

**解決方法**:
1. Script Propertiesの `APP_TOKEN` を確認
2. リクエスト時に `?key=APP_TOKEN` を正しく付与

---

### メール送信エラー

**原因**: Script Propertiesに `MAIL_SUPROLE` または `MAIL_BEFREE` が未設定

**解決方法**:
1. Script Propertiesにメールアドレスを設定
2. メール送信権限が承認されているか確認

---

## ✅ Phase 1-4 完了チェックリスト

```
✅ appsscript.jsonにスコープを追加
✅ config.jsを作成
✅ util.jsにユーティリティ関数を追加
✅ Code.jsにdoPost()を実装
✅ sheets.jsにシートユーティリティを追加
✅ handlers/orders.jsを作成（発注CRUD）
✅ handlers/mail.jsを作成（メール送信）
✅ handlers/products.jsを作成（商品検索）
□ Script Propertiesを設定
□ GASをデプロイ（権限承認）
□ testOrderManagement()を実行して動作確認
□ （オプション）testCreateOrder()で発注作成テスト
```

---

## 🚀 次のステップ

Phase 1-4が完了したら、**Phase 5: Next.jsサーバルート実装**に進みます。

GASのテストが完了したら、続きの実装を開始してください。

