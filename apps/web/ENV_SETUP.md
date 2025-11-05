# 環境変数の設定

## 必須環境変数

このアプリケーションを動作させるには、以下の環境変数を設定する必要があります。

### 1. GAS API設定

```env
# GAS Web AppのデプロイURL
GAS_API_BASE=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec

# GASのScript Propertiesで設定したAPP_TOKEN
GAS_API_KEY=your-super-secret-gas-api-key
```

### 2. Google OAuth設定

Google Cloud Consoleで以下を設定：
1. プロジェクトを作成
2. OAuth 2.0クライアントIDを作成
3. 承認済みのリダイレクトURIに以下を追加：
   - `http://localhost:3000/api/auth/callback/google` (開発)
   - `https://your-domain.vercel.app/api/auth/callback/google` (本番)

```env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-google-client-secret
```

### 3. NextAuth設定

```env
# NextAuthの秘密鍵（ランダムな文字列）
# 生成方法: openssl rand -base64 32
NEXTAUTH_SECRET=your-nextauth-secret-minimum-32-characters
```

### 4. アクセス制御

```env
# 許可するメールアドレス（カンマ区切り）
ALLOWED_EMAILS=user1@example.com,user2@example.com
```

### 5. キャッシュ再検証

```env
# キャッシュ再検証用の秘密鍵
REVALIDATE_SECRET=your-revalidate-secret
```

## ローカル開発

1. `.env.local` ファイルを作成：

```bash
cp .env.example .env.local
```

2. 各環境変数を実際の値に置き換える

3. アプリケーションを起動：

```bash
pnpm dev
```

## Vercelデプロイ

### 方法1: Vercel CLI

```bash
vercel env add GAS_API_BASE
vercel env add GAS_API_KEY
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
vercel env add NEXTAUTH_SECRET
vercel env add ALLOWED_EMAILS
vercel env add REVALIDATE_SECRET
```

### 方法2: Vercel Dashboard

1. Vercelダッシュボードにログイン
2. プロジェクトを選択
3. Settings > Environment Variables
4. 各変数を追加

## セキュリティ注意事項

⚠️ **重要**：以下の点に注意してください

- `.env.local` ファイルは絶対にGitにコミットしない
- `GAS_API_KEY` は秘密にする（クライアント側に露出させない）
- `NEXTAUTH_SECRET` は十分に長く、ランダムな文字列を使用
- 本番環境では強力な秘密鍵を使用
- `ALLOWED_EMAILS` は必要なユーザーのみを追加

## トラブルシューティング

### 認証エラーが発生する場合

1. Google Cloud ConsoleでリダイレクトURIが正しく設定されているか確認
2. `GOOGLE_CLIENT_ID` と `GOOGLE_CLIENT_SECRET` が正しいか確認
3. `NEXTAUTH_SECRET` が設定されているか確認

### アクセスが拒否される場合

1. `ALLOWED_EMAILS` にログインしようとしているメールアドレスが含まれているか確認
2. カンマ区切りで正しく設定されているか確認（スペースは自動削除されます）

### GAS APIに接続できない場合

1. `GAS_API_BASE` のURLが正しいか確認（`/exec` で終わっているか）
2. `GAS_API_KEY` がGASのScript Propertiesと一致しているか確認
3. GASのWeb Appが正しくデプロイされているか確認

