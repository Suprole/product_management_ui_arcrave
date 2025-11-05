# デプロイチェックリスト

このドキュメントでは、アプリケーションをVercelにデプロイする手順を説明します。

## 📋 事前準備

### ✅ Google Cloud Console設定

1. **プロジェクトを作成**
   - https://console.cloud.google.com/ にアクセス
   - 新しいプロジェクトを作成

2. **OAuth同意画面の設定**
   - 「APIとサービス」→「OAuth同意画面」
   - ユーザータイプ: 「外部」（または「内部」）を選択
   - アプリ名、サポートメール、デベロッパーの連絡先を入力
   - スコープは基本的なもの（email, profile）でOK

3. **OAuth 2.0クライアントIDを作成**
   - 「APIとサービス」→「認証情報」
   - 「認証情報を作成」→「OAuth 2.0クライアントID」
   - アプリケーションの種類: 「ウェブアプリケーション」
   - 承認済みのリダイレクトURIに以下を追加：
     ```
     http://localhost:3000/api/auth/callback/google
     https://your-app.vercel.app/api/auth/callback/google
     ```
   - クライアントIDとシークレットをメモ

### ✅ GAS（Google Apps Script）の準備

1. **GASをデプロイ**
   ```bash
   cd apps/gas
   pnpm deploy:prod
   ```

2. **デプロイURLをメモ**
   - Web AppのURL（`https://script.google.com/macros/s/.../exec`）

3. **Script PropertiesにAPP_TOKENを設定**
   - GASエディタで「プロジェクトの設定」→「スクリプトプロパティ」
   - `APP_TOKEN` = ランダムな長い文字列（`openssl rand -base64 32`で生成）

## 🚀 Vercelデプロイ手順

### ステップ1: Vercelにプロジェクトをインポート

1. https://vercel.com/ にログイン
2. 「Add New...」→「Project」
3. GitHubリポジトリをインポート
4. Root Directory: `apps/web` を指定
5. Framework Preset: Next.js（自動検出されるはず）
6. まだデプロイしない（環境変数を先に設定）

### ステップ2: 環境変数の設定

Vercelダッシュボードで「Settings」→「Environment Variables」を開き、以下を追加：

#### 必須の環境変数

| 変数名 | 値 | 環境 |
|--------|-----|------|
| `GAS_API_BASE` | `https://script.google.com/...` | Production, Preview, Development |
| `GAS_API_KEY` | GASのAPP_TOKEN | Production, Preview, Development |
| `GOOGLE_CLIENT_ID` | Google CloudのClient ID | Production, Preview, Development |
| `GOOGLE_CLIENT_SECRET` | Google CloudのClient Secret | Production, Preview, Development |
| `NEXTAUTH_SECRET` | ランダムな文字列（32文字以上） | Production, Preview, Development |
| `ALLOWED_EMAILS` | `user@example.com,user2@example.com` | Production, Preview, Development |
| `REVALIDATE_SECRET` | ランダムな文字列 | Production, Preview, Development |

#### 環境変数の生成コマンド

```bash
# NEXTAUTH_SECRETの生成
openssl rand -base64 32

# REVALIDATE_SECRETの生成
openssl rand -base64 32

# GAS_API_KEY（APP_TOKEN）の生成
openssl rand -base64 32
```

### ステップ3: デプロイ実行

1. 「Deploy」ボタンをクリック
2. デプロイが完了するまで待つ（数分）
3. デプロイURLをメモ（例: `https://your-app.vercel.app`）

### ステップ4: Google Cloud Consoleでリダイレクトを更新

1. Google Cloud Consoleに戻る
2. OAuth 2.0クライアントIDの設定を開く
3. 承認済みのリダイレクトURIに実際のVercel URLを追加：
   ```
   https://your-actual-app.vercel.app/api/auth/callback/google
   ```
4. 保存

## ✅ デプロイ後の確認

### 1. アプリケーションにアクセス

```
https://your-app.vercel.app
```

### 2. 認証フローの確認

- [ ] Googleログイン画面が表示される
- [ ] `ALLOWED_EMAILS`に含まれるアカウントでログイン成功
- [ ] ダッシュボードが表示される
- [ ] データが正しく取得できる

### 3. アクセス制御の確認

- [ ] 許可されていないメールアドレスで「アクセスが拒否されました」と表示される
- [ ] ログアウト後、再度ログインページにリダイレクトされる

### 4. GAS連携の確認

- [ ] ダッシュボードのKPIが表示される
- [ ] 商品一覧が表示される
- [ ] 商品詳細が表示される
- [ ] ブラウザのコンソールにエラーがない

## 🔧 トラブルシューティング

### 問題: 「Configuration」エラー

**原因**: 環境変数が正しく設定されていない

**解決方法**:
1. Vercelダッシュボードで環境変数を確認
2. すべての必須変数が設定されているか確認
3. 変数名のスペルミスがないか確認
4. 再デプロイ

### 問題: 「AccessDenied」エラー

**原因**: `ALLOWED_EMAILS`に含まれていない

**解決方法**:
1. Vercelの環境変数で`ALLOWED_EMAILS`を確認
2. ログインしようとしているメールアドレスを追加
3. カンマ区切りで複数設定（スペースあり・なし両方OK）
4. 再デプロイは不要（環境変数の変更後、次回リクエストから反映）

### 問題: Googleログイン画面が表示されない

**原因**: リダイレクトURIが正しくない

**解決方法**:
1. Google Cloud Consoleで承認済みリダイレクトURIを確認
2. `https://your-app.vercel.app/api/auth/callback/google` が追加されているか確認
3. プロトコル（https）が正しいか確認

### 問題: データが取得できない

**原因**: GAS APIとの接続エラー

**解決方法**:
1. `GAS_API_BASE`のURLが正しいか確認（`/exec`で終わる）
2. `GAS_API_KEY`がGASのScript PropertiesのAPP_TOKENと一致するか確認
3. GASが正しくデプロイされているか確認
4. GASのログを確認（Apps Scriptエディタ→実行ログ）

### 問題: ビルドエラー

**原因**: TypeScriptエラー

**解決方法**:
- `next.config.mjs`で`ignoreBuildErrors: true`が設定されているか確認
- 設定されていれば、ビルドは成功するはず

## 📊 継続的デプロイ

### 自動デプロイの設定

GitHubと連携すると、以下の自動デプロイが有効になります：

- **mainブランチ**: 本番環境に自動デプロイ
- **プルリクエスト**: プレビュー環境に自動デプロイ

### 手動デプロイ

```bash
# Vercel CLIを使用
cd apps/web
vercel --prod
```

## 🔐 セキュリティチェックリスト

デプロイ前に必ず確認：

- [ ] `.env.local`はGitにコミットされていない
- [ ] 本番環境で強力な`NEXTAUTH_SECRET`を使用
- [ ] `GAS_API_KEY`が十分に長く複雑
- [ ] `ALLOWED_EMAILS`が正しく設定されている
- [ ] Google Cloud Consoleでリダイレクトが正しい
- [ ] GASのScript PropertiesにAPP_TOKENが設定されている

## 📝 次のステップ

1. **監視の設定**: Vercel Analyticsでアプリケーションの使用状況を確認
2. **ドメインの設定**: カスタムドメインを設定（任意）
3. **チーム追加**: `ALLOWED_EMAILS`に必要なメンバーを追加
4. **データ確認**: 実際のスプレッドシートデータが正しく表示されるか確認

---

デプロイに関する質問や問題がある場合は、このチェックリストを参照してください。

