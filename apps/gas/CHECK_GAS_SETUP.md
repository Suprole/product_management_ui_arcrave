# GAS設定チェックリスト

## 🚨 現在の問題
```
GET /api/gas/dashboard 500 (Internal Server Error)
📡 Calling GAS API: { path: 'dashboard', ... }
❌ Dashboard API failed: 500 Internal Server Error
```

GAS APIへの呼び出しは開始されているが、500エラーが返されている。
→ **GAS側の設定に問題がある可能性が高い**

## ✅ GAS側の設定チェック

### 1. Script Propertiesの確認

GASエディタを開いて：

1. **設定アイコン（⚙️）**をクリック
2. **「スクリプト プロパティ」**タブを選択
3. 以下が設定されているか確認：

| プロパティ名 | 必須 | 説明 | 例 |
|-------------|------|------|-----|
| `SPREADSHEET_ID` | ✅ | スプレッドシートのID | `1a2b3c...xyz` |
| `APP_TOKEN` | ✅ | API認証キー | 32文字以上のランダムな文字列 |
| `MAIL_SUPROLE` | ⚠️ | メール機能用（任意） | `admin@example.com` |
| `MAIL_BEFREE` | ⚠️ | メール機能用（任意） | `support@example.com` |

#### SPREADSHEET_IDの取得方法

スプレッドシートのURLから取得：
```
https://docs.google.com/spreadsheets/d/1a2b3c4d5e6f7g8h9i0j/edit
                                          ^^^^^^^^^^^^^^^^^
                                          これがSPREADSHEET_ID
```

#### APP_TOKENの生成方法

```bash
openssl rand -base64 32
```

**重要**: この値はVercelの`GAS_API_KEY`と**完全に一致**している必要があります。

### 2. GASのデプロイ状態を確認

```bash
cd apps/gas

# 最新の状態をデプロイ
pnpm deploy:prod
```

デプロイ後、以下を確認：

1. GASエディタで**「デプロイ」→「デプロイを管理」**
2. 最新のデプロイが「アクティブ」になっているか確認
3. **Web AppのURL**をコピー（`/exec`で終わる）
4. このURLがVercelの`GAS_API_BASE`と一致しているか確認

### 3. GAS Web Appのアクセス権限を確認

1. GASエディタで**「デプロイ」→「デプロイを管理」**
2. アクティブなデプロイを選択
3. 「編集」（鉛筆アイコン）をクリック
4. 以下の設定を確認：

```
実行者: 自分
アクセスできるユーザー: 全員（匿名を含む）
```

**注意**: 「全員」でも、API鍵（`APP_TOKEN`）がないとアクセスできないので安全です。

### 4. スプレッドシートの存在確認

1. Script Propertiesで設定した`SPREADSHEET_ID`を使って以下のURLにアクセス：
   ```
   https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID/edit
   ```

2. スプレッドシートが開けるか確認

3. 以下のシートが存在するか確認：
   - ✅ `日次売上集計`
   - ✅ `商品別日次売上集計`
   - ✅ `商品別カート取得率集計`
   - ✅ `商品別在庫日次集計`
   - ✅ `全体在庫日次集計`
   - ✅ `商品マスタ`
   - ✅ `商品状態`

**シート名が1文字でも違うとエラーになります！**

### 5. GAS APIを直接テストする

#### テスト方法1: curl

```bash
# 自分の値に置き換えてください
curl "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?path=dashboard&key=YOUR_APP_TOKEN"
```

#### テスト方法2: ブラウザ

以下のURLをブラウザで開く：
```
https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?path=dashboard&key=YOUR_APP_TOKEN
```

#### 正常なレスポンス

```json
{
  "kpi": {
    "revenue": 1234567,
    "orders": 123,
    "units": 456,
    "stockTotal": 789,
    "recommendedOrderTotal": 50,
    "demandForecastTotal": 100
  },
  "series": {}
}
```

#### エラーレスポンスの例と対処法

**エラー1: unauthorized**
```json
{"error":"unauthorized","_status":401}
```
→ `APP_TOKEN`が間違っているか、`key`パラメータが渡されていない

**エラー2: SPREADSHEET_ID未設定**
```json
{"error":"SPREADSHEET_IDが設定されていません","_status":500}
```
→ Script Propertiesで`SPREADSHEET_ID`を設定

**エラー3: シートが見つからない**
```json
{"error":"Cannot read property 'getSheetByName' of null","_status":500}
```
→ スプレッドシートIDが間違っているか、アクセス権限がない

**エラー4: 列が見つからない**
```json
{"error":"Cannot read property '売上日' of undefined","_status":500}
```
→ スプレッドシートの列名が期待と違う

### 6. GASの実行ログを確認

1. GASエディタを開く
2. **「実行」→「実行ログ」**をクリック
3. 最新のエラーログを確認

よくあるエラー：
```
unauthorized
→ APP_TOKENが一致していない

SPREADSHEET_IDが設定されていません
→ Script Propertiesで設定が必要

Cannot read property 'getSheetByName' of null
→ スプレッドシートIDが間違っているか、アクセス権限がない

シート '日次売上集計' が見つかりません
→ シート名が違う
```

## 🔄 設定修正後の手順

### 1. GASを再デプロイ

```bash
cd apps/gas
pnpm deploy:prod
```

### 2. Vercelの環境変数を再確認

```bash
cd apps/web
vercel env ls
```

特に以下を確認：
- `GAS_API_BASE` = GASのデプロイURL（`/exec`で終わる）
- `GAS_API_KEY` = GASの`APP_TOKEN`と**完全一致**

### 3. Vercelを再デプロイ

```bash
vercel --prod --force
```

### 4. 再テスト

1. アプリにアクセス
2. ブラウザのコンソールを開く（F12）
3. ダッシュボードを表示
4. エラーが出ないか確認

## 📋 チェックリスト

GAS側：
- [ ] Script Propertiesに`SPREADSHEET_ID`が設定されている
- [ ] Script Propertiesに`APP_TOKEN`が設定されている
- [ ] スプレッドシートが存在し、アクセス可能
- [ ] 必要なシートがすべて存在する
- [ ] GASが最新の状態でデプロイされている
- [ ] Web Appのアクセス権限が「全員」になっている
- [ ] GAS APIを直接テストして成功する

Vercel側：
- [ ] `GAS_API_BASE`が設定されている（GASのデプロイURL）
- [ ] `GAS_API_KEY`がGASの`APP_TOKEN`と一致している
- [ ] その他の環境変数がすべて設定されている
- [ ] 最新の状態でデプロイされている

## 🆘 それでも解決しない場合

### GASのテスト関数を実行

GASエディタで以下の関数を作成して実行：

```javascript
function testConfig() {
  Logger.log('=== 設定テスト ===');
  
  // Script Properties
  var props = PropertiesService.getScriptProperties();
  var spreadsheetId = props.getProperty('SPREADSHEET_ID');
  var appToken = props.getProperty('APP_TOKEN');
  
  Logger.log('SPREADSHEET_ID: ' + (spreadsheetId ? '設定済み (' + spreadsheetId.substring(0, 10) + '...)' : '未設定'));
  Logger.log('APP_TOKEN: ' + (appToken ? '設定済み (' + appToken.length + '文字)' : '未設定'));
  
  // スプレッドシートアクセス
  if (spreadsheetId) {
    try {
      var ss = SpreadsheetApp.openById(spreadsheetId);
      Logger.log('スプレッドシート: アクセス成功');
      
      // シートの存在確認
      var sheets = ['日次売上集計', '商品別日次売上集計', '商品マスタ', '商品状態'];
      sheets.forEach(function(name) {
        var sheet = ss.getSheetByName(name);
        Logger.log('  - ' + name + ': ' + (sheet ? 'OK' : '見つかりません'));
      });
    } catch (e) {
      Logger.log('スプレッドシート: エラー - ' + e.message);
    }
  }
  
  Logger.log('=== テスト完了 ===');
}
```

実行方法：
1. 上記のコードをGASエディタに貼り付け
2. 「testConfig」を選択
3. 「実行」をクリック
4. 「実行ログ」を確認

### Vercelでテストエンドポイントを作成

`apps/web/app/api/test-gas/route.ts` を作成：

```typescript
import { NextResponse } from 'next/server'

export async function GET() {
  const base = process.env.GAS_API_BASE
  const key = process.env.GAS_API_KEY
  
  console.log('=== GAS設定テスト ===')
  console.log('GAS_API_BASE:', base ? `${base.substring(0, 50)}...` : '未設定')
  console.log('GAS_API_KEY:', key ? `${key.substring(0, 10)}... (${key.length}文字)` : '未設定')
  
  if (!base || !key) {
    return NextResponse.json({
      error: '環境変数が未設定',
      hasBase: !!base,
      hasKey: !!key,
    }, { status: 500 })
  }
  
  try {
    const url = `${base}?path=dashboard&key=${key}`
    console.log('呼び出しURL:', url.replace(key, '***'))
    
    const res = await fetch(url, { cache: 'no-store' })
    console.log('レスポンスステータス:', res.status)
    console.log('Content-Type:', res.headers.get('content-type'))
    
    const text = await res.text()
    console.log('レスポンス（最初の500文字）:', text.substring(0, 500))
    
    return NextResponse.json({
      success: true,
      status: res.status,
      contentType: res.headers.get('content-type'),
      responsePreview: text.substring(0, 200),
    })
  } catch (error: any) {
    console.error('エラー:', error)
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    }, { status: 500 })
  }
}
```

アクセス：
```
https://your-app.vercel.app/api/test-gas
```

このエンドポイントでGAS APIとの接続をテストできます。

