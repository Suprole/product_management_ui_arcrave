"use client"

import Link from "next/link"
import { Package, ShoppingCart } from "lucide-react"
import { usePathname } from "next/navigation"
import { useOrderCart } from "@/lib/order-cart"

export function DashboardHeader() {
  const pathname = usePathname()
  const { summary } = useOrderCart()

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

          <div className="flex items-center gap-3">
            <Link
              href="/orders/cart"
              className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                pathname === "/orders/cart"
                  ? "border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ShoppingCart className="h-4 w-4" />
              発注カート
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                {summary.itemCount}
              </span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
