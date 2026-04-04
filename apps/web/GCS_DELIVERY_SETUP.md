# GCS 配信設定

読取系 JSON は、Next 側の [lib/server/read-models.ts](lib/server/read-models.ts) と export スクリプト [scripts/export-gcs-read-models.mjs](scripts/export-gcs-read-models.mjs) が同じ規則で参照します。

## 推奨値

- `GCS_JSON_PREFIX=read-models/v1`
- `GCS_JSON_BASE_URL=https://storage.googleapis.com/<bucket-name>`

CDN を挟む場合は以下でも可です。

- `GCS_JSON_BASE_URL=https://<cdn-domain>`

## 期待されるオブジェクト配置

```text
read-models/v1/
  manifest.json
  dashboard/
    from-YYYY-MM-DD__to-YYYY-MM-DD__grain-day.json
  products/
    from-YYYY-MM-DD__to-YYYY-MM-DD__grain-day.json
    from-2000-01-01__to-default__grain-day.json
  alerts/
    from-YYYY-MM-DD__to-YYYY-MM-DD__grain-day.json
  masters/
    all.json
  product/
    <SKU>/
      from-default__to-default__grain-day.json
```

## Vercel 側で使う env

```env
READ_API_SOURCE=hybrid
GCS_JSON_BASE_URL=https://storage.googleapis.com/<bucket-name>
GCS_JSON_PREFIX=read-models/v1
```

## まず確認する URL

```text
https://storage.googleapis.com/<bucket-name>/read-models/v1/manifest.json
https://storage.googleapis.com/<bucket-name>/read-models/v1/masters/all.json
```

## 注意点

- `hybrid` では `GCS_JSON_BASE_URL` が未設定でも GAS にフォールバックする
- `gcs-json` は欠損オブジェクトで失敗するため、本番初期は非推奨
- `product` は SKU 数に比例してファイル数が増えるため、初回は `dashboard/products/alerts/masters` の確認を優先する
