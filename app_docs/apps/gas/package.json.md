# apps/gas/package.json

- **役割**: GAS スクリプト（シート読み取り/統合/ハンドラ）

- **セキュリティ**: 機密（GAS_API_KEY等）はサーバのみ参照。クライアントへ出さない。
- **キャッシュ**: GAS=120秒、UI=ISR+SWR の多層キャッシュを意識する。

---
<reference (first 20 lines)>

````
{
  "name": "@app/gas",
  "private": true,
  "scripts": {
    "clasp:login": "clasp login",
    "use:dev": "cp .clasp.dev.json .clasp.json",
    "use:prod": "cp .clasp.prod.json .clasp.json",
    "push": "clasp push",
    "deploy:version": "clasp version 'deploy'",
    "deploy:webapp": "clasp deploy -d 'webapp'",
    "deploy:dev": "pnpm use:dev && pnpm push && pnpm deploy:version && pnpm deploy:webapp",
    "deploy:prod": "pnpm use:prod && pnpm push && pnpm deploy:version && pnpm deploy:webapp"
  },
  "devDependencies": {
    "@google/clasp": "^2.4.2"
  }
}


````
