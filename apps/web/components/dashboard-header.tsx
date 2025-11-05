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
              <Link
                href="/"
                className={`text-sm font-medium transition-colors ${
                  pathname === "/" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                ダッシュボード
              </Link>
              <Link
                href="/products"
                className={`text-sm font-medium transition-colors ${
                  pathname?.startsWith("/products") ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                商品管理
              </Link>
              <Link
                href="/sales"
                className={`text-sm font-medium transition-colors ${
                  pathname === "/sales" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                売上分析
              </Link>
              <Link
                href="/inventory"
                className={`text-sm font-medium transition-colors ${
                  pathname === "/inventory" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                在庫管理
              </Link>
              <Link
                href="/orders"
                className={`text-sm font-medium transition-colors ${
                  pathname?.startsWith("/orders") ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                発注管理
              </Link>
              <Link
                href="/masters"
                className={`text-sm font-medium transition-colors ${
                  pathname === "/masters" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                マスタ閲覧
              </Link>
            </nav>
          </div>

          {/* <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">最終更新: 2025/10/20</div>
          </div> */}
        </div>
      </div>
    </header>
  )
}
