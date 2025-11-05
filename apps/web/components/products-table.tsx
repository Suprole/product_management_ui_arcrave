"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, ArrowUpDown, Loader2, ShoppingCart } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
// import from API instead of mock data
import Link from "next/link"

type UIProduct = {
  sku: string
  productName: string
  orderCount: number
  currentStock: number
  totalSales: number
  totalProfit: number
  profitRate: number
}

export function ProductsTable() {
  const [products, setProducts] = useState<UIProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<string>("totalProfit")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  useEffect(() => {
    const run = async () => {
      try {
        setIsLoading(true)
        // 全期間のデータを取得するため、from=2000-01-01 を指定
        const res = await fetch(`/api/gas/products?from=2000-01-01`, { cache: 'no-store' })
        const data = await res.json()
        const items = Array.isArray(data?.items) ? data.items : []
        const mapped: UIProduct[] = items.map((it: any) => ({
          sku: it.sku,
          productName: it.name || it.productName || '',
          orderCount: it.orders ?? it.orderCount ?? 0,
          currentStock: it.stock ?? it.currentStock ?? 0,
          totalSales: Math.round(it.revenue ?? it.totalSales ?? 0),
          totalProfit: Math.round(it.profit ?? it.totalProfit ?? 0),
          profitRate: typeof it.profitRate === 'number' ? it.profitRate : ((it.revenue ? ((it.profit ?? 0) / (it.revenue || 1)) * 100 : 0)),
        }))
        setProducts(mapped)
      } catch (error) {
        console.error('商品データの取得に失敗しました:', error)
      } finally {
        setIsLoading(false)
      }
    }
    run()
  }, [])

  const filteredProducts = products
    .filter(
      (p) =>
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.productName.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => {
      const aVal = (a as any)[sortField]
      const bVal = (b as any)[sortField]
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal
      }
      return 0
    })

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">商品一覧</CardTitle>
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">読み込み中...</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">SKU</TableHead>
                  <TableHead className="text-muted-foreground">商品名</TableHead>
                  <TableHead className="text-muted-foreground text-right">在庫</TableHead>
                  <TableHead className="text-muted-foreground text-right">売上</TableHead>
                  <TableHead className="text-muted-foreground text-right">利益</TableHead>
                  <TableHead className="text-muted-foreground text-right">利益率</TableHead>
                  <TableHead className="text-muted-foreground text-right">注文数</TableHead>
                  <TableHead className="text-muted-foreground">状態</TableHead>
                  <TableHead className="text-muted-foreground">アクション</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(10)].map((_, i) => (
                  <TableRow key={i} className="border-border">
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">商品一覧</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="SKUまたは商品名で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64 bg-background border-border"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">SKU</TableHead>
                <TableHead className="text-muted-foreground">商品名</TableHead>
                <TableHead className="text-muted-foreground text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("currentStock")}
                    className="hover:bg-transparent"
                  >
                    在庫 <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-muted-foreground text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("totalSales")}
                    className="hover:bg-transparent"
                  >
                    売上 <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-muted-foreground text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("totalProfit")}
                    className="hover:bg-transparent"
                  >
                    利益 <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-muted-foreground text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("profitRate")}
                    className="hover:bg-transparent"
                  >
                    利益率 <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-muted-foreground text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("orderCount")}
                    className="hover:bg-transparent"
                  >
                    注文数 <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-muted-foreground">状態</TableHead>
                <TableHead className="text-muted-foreground">アクション</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.sku} className="border-border hover:bg-muted/50">
                  <TableCell className="font-mono text-sm">
                    <Link 
                      href={`/products/${product.sku}`} 
                      className="hover:underline text-blue-500"
                      prefetch={true}
                    >
                      {product.sku}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    <Link 
                      href={`/products/${product.sku}`} 
                      className="hover:text-blue-500 transition-colors"
                      prefetch={true}
                    >
                      {product.productName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={product.currentStock === 0 ? "text-destructive font-semibold" : ""}>
                      {product.currentStock}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">¥{product.totalSales.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <span
                      className={
                        product.totalProfit >= 0 ? "text-green-500 font-semibold" : "text-red-500 font-semibold"
                      }
                    >
                      ¥{product.totalProfit.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={product.profitRate >= 0 ? "text-green-500" : "text-red-500"}>
                      {product.profitRate.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{product.orderCount}</TableCell>
                  <TableCell>
                    {product.currentStock === 0 && (
                      <Badge variant="destructive" className="text-xs">
                        在庫切れ
                      </Badge>
                    )}
                    {product.currentStock > 0 && product.currentStock < 20 && (
                      <Badge variant="secondary" className="text-xs">
                        在庫不足
                      </Badge>
                    )}
                    {product.currentStock >= 20 && (
                      <Badge variant="default" className="text-xs">
                        正常
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link href={`/orders/create?sku=${product.sku}`}>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        <ShoppingCart className="h-3.5 w-3.5" />
                        発注
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
