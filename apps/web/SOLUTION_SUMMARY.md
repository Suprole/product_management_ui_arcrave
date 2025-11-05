# エラー解決のまとめ

## 発生していた問題

### エラーメッセージ
```
Runtime SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

### 症状
- Googleログイン後、ダッシュボードにエラーが表示される
- GAS APIからJSONではなくHTMLが返ってくる
- データが取得できない

## 根本原因

**認証機能が実装されていなかった**ため、以下の問題が連鎖的に発生：

1. ❌ NextAuth（認証ライブラリ）が未インストール
2. ❌ 認証設定ファイル（`lib/auth.ts`）が存在しない
3. ❌ middleware.ts（認証チェック）が存在しない
4. ❌ ログインページが存在しない
5. ❌ 環境変数（`GAS_API_BASE`, `GAS_API_KEY`等）が未設定

その結果、GAS APIへのリクエストが失敗し、HTMLエラーページが返されていた。

## 実装した解決策

### 1. 認証機能の完全実装

#### インストールしたパッケージ
```bash
pnpm add next-auth@beta
```

#### 作成したファイル

```
apps/web/
├── lib/
│   └── auth.ts                           # NextAuth設定 + allowlistチェック
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/route.ts    # NextAuthエンドポイント
│   └── auth/
│       ├── signin/page.tsx               # Googleログインページ
│       └── error/page.tsx                # エラーページ
├── components/
│   └── session-provider.tsx              # クライアント用SessionProvider
└── middleware.ts                         # 全ページで認証チェック
```

#### 更新したファイル
- `app/layout.tsx` - SessionProviderを追加

### 2. エラーハンドリングの改善

#### `/api/gas/dashboard/route.ts`
- 詳細なエラーログを追加
- コンテンツタイプのチェックを追加
- HTMLレスポンスの検出とエラーメッセージ改善

#### `components/kpi-cards.tsx`
- try-catchでエラーをキャッチ
- エラー時にユーザーフレンドリーなメッセージを表示
- エラー詳細をコンソールに出力

### 3. ドキュメント作成

| ファイル | 説明 |
|---------|------|
| `ENV_SETUP.md` | 環境変数の設定方法 |
| `DEPLOYMENT_CHECKLIST.md` | デプロイの完全なチェックリスト |
| `TROUBLESHOOTING.md` | 問題が発生した時の診断・解決方法 |
| `SOLUTION_SUMMARY.md` | このファイル（解決策のまとめ） |

### 4. 診断ツール

```bash
# 環境変数をチェックするスクリプト
pnpm check-env
```

## 次に必要な作業

### ステップ1: Google OAuth設定

1. **Google Cloud Console**（https://console.cloud.google.com/）にアクセス
2. プロジェクトを作成
3. 「APIとサービス」→「認証情報」→「OAuth 2.0 クライアントID」を作成
4. リダイレクトURIを追加：
   ```
   https://your-app.vercel.app/api/auth/callback/google
   ```
5. Client IDとClient Secretをメモ

### ステップ2: GAS Script Propertiesの設定

1. GASエディタを開く
2. 「プロジェクトの設定」→「スクリプトプロパティ」
3. 以下を追加：

| プロパティ名 | 値 | 説明 |
|-------------|-----|------|
| `SPREADSHEET_ID` | スプレッドシートID | スプレッドシートのURLから取得 |
| `APP_TOKEN` | ランダムな文字列（32文字以上） | `openssl rand -base64 32`で生成 |

### ステップ3: Vercel環境変数の設定

Vercelダッシュボードで以下を設定：

```bash
# または、Vercel CLIで設定
vercel env add GAS_API_BASE
# 値: https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec

vercel env add GAS_API_KEY
# 値: GASのAPP_TOKENと同じ値

vercel env add GOOGLE_CLIENT_ID
# 値: Google CloudのClient ID

vercel env add GOOGLE_CLIENT_SECRET
# 値: Google CloudのClient Secret

vercel env add NEXTAUTH_SECRET
# 値: openssl rand -base64 32 で生成

vercel env add ALLOWED_EMAILS
# 値: your-email@example.com,teammate@example.com

vercel env add REVALIDATE_SECRET
# 値: openssl rand -base64 32 で生成
```

### ステップ4: デプロイ

```bash
# GASを再デプロイ
cd apps/gas
pnpm deploy:prod

# Vercelを再デプロイ
cd apps/web
vercel --prod --force
```

### ステップ5: 動作確認

1. ✅ https://your-app.vercel.app にアクセス
2. ✅ Googleログイン画面が表示される
3. ✅ 許可されたメールアドレスでログイン
4. ✅ ダッシュボードが表示される
5. ✅ KPIカードにデータが表示される

## よくある質問

### Q: まだHTMLエラーが出る

A: 以下を確認してください：
1. Vercelの環境変数がすべて設定されているか（`vercel env ls`）
2. `GAS_API_KEY`とGASの`APP_TOKEN`が一致しているか
3. GASのScript Propertiesに`SPREADSHEET_ID`が設定されているか
4. GASが正しくデプロイされているか（`pnpm -C apps/gas deploy:prod`）

### Q: "GAS API not configured"エラー

A: Vercelの環境変数が読み込まれていません：
1. 環境変数を設定
2. `vercel --prod --force` で再デプロイ

### Q: "AccessDenied"エラー

A: `ALLOWED_EMAILS`にログインしようとしているメールアドレスが含まれていません：
1. Vercelの環境変数で`ALLOWED_EMAILS`を確認
2. ログインしようとしているメールアドレスを追加
3. 再デプロイは不要（環境変数の変更は即座に反映）

### Q: ログインページが表示されない

A: Google Cloud Consoleでリダイレクトが設定されていません：
1. Google Cloud Console→OAuth 2.0クライアント
2. 承認済みのリダイレクトURIに以下を追加：
   ```
   https://your-actual-app.vercel.app/api/auth/callback/google
   ```

## 参考資料

- **環境変数の設定**: `ENV_SETUP.md`
- **デプロイ手順**: `DEPLOYMENT_CHECKLIST.md`
- **トラブルシューティング**: `TROUBLESHOOTING.md`
- **Next.js App Router**: https://nextjs.org/docs/app
- **NextAuth.js**: https://authjs.dev/
- **Vercel環境変数**: https://vercel.com/docs/environment-variables

## 技術的な詳細

### 認証フロー

```
1. ユーザーがアプリにアクセス
   ↓
2. middleware.tsが認証状態をチェック
   ↓
3. 未認証の場合、/auth/signinにリダイレクト
   ↓
4. Googleログインボタンをクリック
   ↓
5. Google OAuth画面
   ↓
6. 認証成功後、callbackが呼ばれる
   ↓
7. lib/auth.tsでallowlistチェック
   ↓
8a. OK → セッション作成 → ダッシュボード表示
8b. NG → /auth/errorにリダイレクト
```

### データフロー

```
ブラウザ
  ↓ (認証済み)
Next.js /api/gas/dashboard
  ↓ (GAS_API_KEYを付与)
GAS Web App
  ↓ (APP_TOKENチェック)
guard_()関数
  ↓ (OK)
handleDashboard_()
  ↓
スプレッドシート読み取り
  ↓
JSON返却
  ↓
Next.js
  ↓
ブラウザに表示
```

## まとめ

このエラーは、**認証機能が未実装**だったことが根本原因でした。

認証機能を実装し、エラーハンドリングを改善することで：
1. ✅ セキュアな認証フロー（Googleログイン + allowlist）
2. ✅ 適切なエラーメッセージ表示
3. ✅ デバッグしやすいログ出力
4. ✅ 完全なドキュメント

が実現できました。

**次のステップ**: 上記の「次に必要な作業」を順番に実行してください。

