# apps/web/components/dashboard-header.tsx

- **役割**: 再利用可能なUIコンポーネント

- **セキュリティ**: 機密（GAS_API_KEY等）はサーバのみ参照。クライアントへ出さない。
- **キャッシュ**: GAS=120秒、UI=ISR+SWR の多層キャッシュを意識する。

---
<reference (first 20 lines)>

````
"use client"

import Link from "next/link"
import { Package } from "lucide-react"
import { usePathname } from "next/navigation"

export function DashboardHeader() {
  const pathname = usePathname()

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" />
              <span className="text-xl font-semibold">Amazon Seller Dashboard</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
````

## データマッピング
- 現時点では静的UI（リンク/ナビ）。将来: 検索サジェストを `/api/gas/products/suggest?q` で実装可能。

## 必要API（将来）
- GET /api/gas/products/suggest?q&limit