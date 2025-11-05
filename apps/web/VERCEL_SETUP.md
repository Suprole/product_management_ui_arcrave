# Vercel環境変数の設定手順

## 🚨 現在のエラー
```
GET /api/gas/dashboard 500 (Internal Server Error)
```

このエラーは**環境変数が未設定**の可能性が高いです。

## ✅ 設定手順

### 方法1: Vercelダッシュボード（推奨）

#### ステップ1: ダッシュボードにアクセス
1. https://vercel.com/dashboard にログイン
2. プロジェクト `product-management-ui-web` を選択
3. 上部メニューの **Settings** をクリック
4. 左サイドバーの **Environment Variables** をクリック

#### ステップ2: 環境変数を追加

以下の環境変数を1つずつ追加してください：

---

**1. GAS_API_BASE**
```
Name: GAS_API_BASE
Value: https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
Environment: Production, Preview, Development (全てチェック)
```

**取得方法**:
1. GASエディタを開く
2. 「デプロイ」→「デプロイを管理」
3. アクティブなデプロイのURLをコピー
4. `/exec` で終わっていることを確認

---

**2. GAS_API_KEY**
```
Name: GAS_API_KEY
Value: (GASのScript PropertiesのAPP_TOKENと同じ値)
Environment: Production, Preview, Development (全てチェック)
```

**取得方法**:
1. GASエディタで「プロジェクトの設定」→「スクリプトプロパティ」
2. `APP_TOKEN` の値をコピー
3. **未設定の場合**、以下で生成：
   ```bash
   openssl rand -base64 32
   ```
   生成した値をGASのScript Propertiesに設定してから、Vercelにも同じ値を設定

---

**3. GOOGLE_CLIENT_ID**
```
Name: GOOGLE_CLIENT_ID
Value: YOUR_CLIENT_ID.apps.googleusercontent.com
Environment: Production, Preview, Development (全てチェック)
```

**取得方法**:
1. https://console.cloud.google.com/ にアクセス
2. 「APIとサービス」→「認証情報」
3. OAuth 2.0 クライアントIDの Client ID をコピー

---

**4. GOOGLE_CLIENT_SECRET**
```
Name: GOOGLE_CLIENT_SECRET
Value: GOCSPX-xxxxxxxxxxxxxxxxxxxxx
Environment: Production, Preview, Development (全てチェック)
```

**取得方法**:
1. Google Cloud Consoleの同じページ
2. Client Secret をコピー

---

**5. NEXTAUTH_SECRET**
```
Name: NEXTAUTH_SECRET
Value: (ランダムな長い文字列)
Environment: Production, Preview, Development (全てチェック)
```

**生成方法**:
```bash
openssl rand -base64 32
```

---

**6. ALLOWED_EMAILS**
```
Name: ALLOWED_EMAILS
Value: your-email@example.com
Environment: Production, Preview, Development (全てチェック)
```

**例**:
```
single-user@example.com
```
または
```
user1@example.com,user2@example.com,user3@example.com
```

---

**7. REVALIDATE_SECRET**
```
Name: REVALIDATE_SECRET
Value: (ランダムな長い文字列)
Environment: Production, Preview, Development (全てチェック)
```

**生成方法**:
```bash
openssl rand -base64 32
```

---

#### ステップ3: 保存して再デプロイ

1. すべての環境変数を追加したら、「Save」をクリック
2. Vercelが自動的に再デプロイを開始します
3. または、**Deployments** タブ → 最新のデプロイ → **Redeploy** をクリック

### 方法2: Vercel CLI

```bash
cd apps/web

# 1つずつ追加
vercel env add GAS_API_BASE
# 値を入力: https://script.google.com/macros/s/.../exec

vercel env add GAS_API_KEY
# 値を入力: (GASのAPP_TOKENと同じ)

vercel env add GOOGLE_CLIENT_ID
# 値を入力: YOUR_CLIENT_ID.apps.googleusercontent.com

vercel env add GOOGLE_CLIENT_SECRET
# 値を入力: GOCSPX-...

vercel env add NEXTAUTH_SECRET
# 値を入力: (openssl rand -base64 32 で生成)

vercel env add ALLOWED_EMAILS
# 値を入力: your@example.com

vercel env add REVALIDATE_SECRET
# 値を入力: (openssl rand -base64 32 で生成)

# 再デプロイ
vercel --prod
```

## 🔍 確認方法

### 1. 環境変数が設定されているか確認

```bash
vercel env ls
```

出力例：
```
Environment Variables for project product-management-ui-web

Production:
  GAS_API_BASE          (created 1m ago)
  GAS_API_KEY           (created 1m ago)
  GOOGLE_CLIENT_ID      (created 1m ago)
  GOOGLE_CLIENT_SECRET  (created 1m ago)
  NEXTAUTH_SECRET       (created 1m ago)
  ALLOWED_EMAILS        (created 1m ago)
  REVALIDATE_SECRET     (created 1m ago)
```

### 2. デプロイが成功したか確認

1. Vercelダッシュボード → **Deployments**
2. 最新のデプロイが「Ready」になっているか確認

### 3. アプリケーションにアクセス

```
https://product-management-ui-web.vercel.app/
```

1. ✅ Googleログイン画面が表示される
2. ✅ ログイン成功
3. ✅ ダッシュボードが表示される
4. ✅ KPIカードにデータが表示される
5. ✅ 500エラーが出ない

### 4. ブラウザのコンソールを確認

- ❌ `500 (Internal Server Error)` が表示されない
- ✅ データが正常に取得される

## 🚨 まだエラーが出る場合

### GAS側の確認

1. **GASが正しくデプロイされているか**
   ```bash
   cd apps/gas
   pnpm deploy:prod
   ```

2. **GAS Script Propertiesの確認**
   - GASエディタ → 「プロジェクトの設定」 → 「スクリプトプロパティ」
   - 以下が設定されているか確認：
     - `SPREADSHEET_ID` = スプレッドシートのID
     - `APP_TOKEN` = ランダムな文字列（Vercelの`GAS_API_KEY`と同じ）

3. **GAS APIを直接テスト**
   ```bash
   curl "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?path=dashboard&key=YOUR_APP_TOKEN"
   ```
   
   **正常な場合**:
   ```json
   {"kpi":{"revenue":1000000,...}}
   ```
   
   **エラーの場合**:
   ```json
   {"error":"unauthorized","_status":401}
   ```

### Vercelログの詳細確認

1. Vercelダッシュボード → **Logs**
2. リアルタイムログを表示
3. アプリにアクセスしてエラーを再現
4. ログに表示されるエラーメッセージを確認

## 📋 チェックリスト

- [ ] Vercelに7つの環境変数すべてが設定されている
- [ ] GASがデプロイされている
- [ ] GAS Script Propertiesに`APP_TOKEN`と`SPREADSHEET_ID`が設定されている
- [ ] `GAS_API_KEY`とGASの`APP_TOKEN`が一致している
- [ ] Vercelで再デプロイが完了している
- [ ] アプリにアクセスして500エラーが出ない

## 💡 ヒント

### Analytics 404エラーについて

```
GET /_vercel/insights/script.js 404 (Not Found)
```

これは**無視してOK**です。Vercel Analyticsを有効化していない場合に表示されますが、アプリの動作には影響しません。

有効化したい場合：
1. Vercelダッシュボード → **Analytics**
2. 「Enable」をクリック

## 📚 関連ドキュメント

- `ENV_SETUP.md` - 環境変数の詳細説明
- `DEPLOYMENT_CHECKLIST.md` - デプロイの完全なチェックリスト
- `TROUBLESHOOTING.md` - トラブルシューティングガイド

