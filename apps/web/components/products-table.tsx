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
import { getCurrentMonthToDateTokyo, getPreviousMonthTokyo } from "@/lib/date-range"

type UIProduct = {
  sku: string
  productName: string
  currentStock: number
  ordersPrev: number
  ordersCur: number
  revenuePrev: number
  revenueCur: number
  totalProfitCur: number
  profitRateCur: number
}

export function ProductsTable() {
  const [products, setProducts] = useState<UIProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<string>("totalProfitCur")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  useEffect(() => {
    const run = async () => {
      try {
        setIsLoading(true)
        const cur = getCurrentMonthToDateTokyo()
        const prev = getPreviousMonthTokyo()

        const [resPrev, resCur] = await Promise.all([
          fetch(`/api/gas/products?from=${prev.from}&to=${prev.to}`, { cache: 'no-store' }),
          fetch(`/api/gas/products?from=${cur.from}&to=${cur.to}`, { cache: 'no-store' }),
        ])
        const [dataPrev, dataCur] = await Promise.all([resPrev.json(), resCur.json()])

        const prevItems: any[] = Array.isArray(dataPrev?.items) ? dataPrev.items : []
        const curItems: any[] = Array.isArray(dataCur?.items) ? dataCur.items : []

        const normalize = (it: any) => ({
          sku: String(it.sku || ''),
          name: String(it.name || it.productName || ''),
          orders: Number(it.orders ?? it.orderCount ?? 0),
          revenue: Number(it.revenue ?? it.totalSales ?? 0),
          profit: Number(it.profit ?? it.totalProfit ?? 0),
          profitRate:
            typeof it.profitRate === 'number'
              ? it.profitRate
              : (Number(it.revenue ?? 0) ? (Number(it.profit ?? 0) / (Number(it.revenue) || 1)) * 100 : 0),
          stock: Number(it.stock ?? it.currentStock ?? 0),
        })

        const prevMap = new Map(prevItems.map((it) => [String(it.sku || ''), normalize(it)]))
        const curMap = new Map(curItems.map((it) => [String(it.sku || ''), normalize(it)]))
        const skus = Array.from(new Set([...prevMap.keys(), ...curMap.keys()])).filter(Boolean)

        const mapped: UIProduct[] = skus.map((sku) => {
          const p = prevMap.get(sku)
          const c = curMap.get(sku)
          return {
            sku,
            productName: c?.name || p?.name || '',
            currentStock: c?.stock ?? p?.stock ?? 0,
            ordersPrev: p?.orders ?? 0,
            ordersCur: c?.orders ?? 0,
            revenuePrev: Math.round(p?.revenue ?? 0),
            revenueCur: Math.round(c?.revenue ?? 0),
            totalProfitCur: Math.round(c?.profit ?? 0),
            profitRateCur: typeof c?.profitRate === 'number' ? c!.profitRate : 0,
          }
        })

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
                  <TableHead className="text-muted-foreground text-right">注文件数（前月）</TableHead>
                  <TableHead className="text-muted-foreground text-right">注文件数（今月）</TableHead>
                  <TableHead className="text-muted-foreground text-right">売上（前月）</TableHead>
                  <TableHead className="text-muted-foreground text-right">売上（今月）</TableHead>
                  <TableHead className="text-muted-foreground text-right">利益（今月）</TableHead>
                  <TableHead className="text-muted-foreground text-right">利益率（今月）</TableHead>
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
                    <TableCell><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
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
                    onClick={() => handleSort("ordersPrev")}
                    className="hover:bg-transparent"
                  >
                    注文件数（前月） <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-muted-foreground text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("ordersCur")}
                    className="hover:bg-transparent"
                  >
                    注文件数（今月） <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-muted-foreground text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("revenuePrev")}
                    className="hover:bg-transparent"
                  >
                    売上（前月） <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-muted-foreground text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("revenueCur")}
                    className="hover:bg-transparent"
                  >
                    売上（今月） <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-muted-foreground text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("totalProfitCur")}
                    className="hover:bg-transparent"
                  >
                    利益（今月） <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-muted-foreground text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("profitRateCur")}
                    className="hover:bg-transparent"
                  >
                    利益率（今月） <ArrowUpDown className="ml-1 h-3 w-3" />
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
                  <TableCell className="text-right">{product.ordersPrev}</TableCell>
                  <TableCell className="text-right font-semibold">{product.ordersCur}</TableCell>
                  <TableCell className="text-right">¥{product.revenuePrev.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-semibold">¥{product.revenueCur.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-semibold">
                    <span
                      className={
                        product.totalProfitCur >= 0 ? "text-green-500" : "text-red-500"
                      }
                    >
                      ¥{product.totalProfitCur.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={product.profitRateCur >= 0 ? "text-green-500" : "text-red-500"}>
                      {product.profitRateCur.toFixed(1)}%
                    </span>
                  </TableCell>
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
