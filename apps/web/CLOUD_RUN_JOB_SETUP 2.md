# Cloud Run Job セットアップ

`apps/web/scripts/export-gcs-read-models.mjs` を Cloud Run Job で定期実行し、GCS に読取モデル JSON を出力するための手順です。

## 前提

- `GAS_API_BASE` と `GAS_API_KEY` で本番 GAS が読める
- GCS バケットが作成済み
- Vercel 側は `READ_API_SOURCE=hybrid` から始める
- `GCS_JSON_BASE_URL` は以下のどちらかを使う
  - `https://storage.googleapis.com/<bucket-name>`
  - CDN / Load Balancer の HTTPS URL

## 推奨設定

- Bucket: `gs://<bucket-name>`
- Prefix: `read-models/v1`
- Cache-Control: スクリプト既定の `public, max-age=60, s-maxage=300`
- 実行頻度: 5分または10分

## Cloud Run Job 用 env

```env
GAS_API_BASE=https://script.google.com/macros/s/.../exec
GAS_API_KEY=...
GCS_JSON_BUCKET=<bucket-name>
GCS_JSON_PREFIX=read-models/v1
GCS_PROJECT_ID=<gcp-project-id>
GCS_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

オプション:

```env
GCS_PRODUCT_EXPORT_LIMIT=0
READ_MODEL_EXPORT_DRY_RUN=0
```

## デプロイ手順

1. `apps/web` を build できるコンテナを用意する
2. Cloud Run Job に上記 env を設定する
3. 実行コマンドを `pnpm -C apps/web export:read-models` にする
4. 初回は手動実行して `manifest.json` を確認する
5. Cloud Scheduler から定期実行する

## 実行後の確認

- `gs://<bucket-name>/read-models/v1/manifest.json`
- `gs://<bucket-name>/read-models/v1/dashboard/...`
- `gs://<bucket-name>/read-models/v1/products/...`
- `gs://<bucket-name>/read-models/v1/alerts/...`
- `gs://<bucket-name>/read-models/v1/masters/all.json`

## Vercel 側の対応

Production / Preview に以下を設定します。

```env
READ_API_SOURCE=hybrid
GCS_JSON_BASE_URL=https://storage.googleapis.com/<bucket-name>
GCS_JSON_PREFIX=read-models/v1
```

## 切替の目安

- `hybrid`: 最初の本番導入
- `gcs-json`: `manifest.json` 更新監視、ジョブ成功率監視、主要APIの疎通確認が安定してから
