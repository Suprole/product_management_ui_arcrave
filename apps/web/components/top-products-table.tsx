import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"
import Link from "next/link"
import { ProductsResponse } from "@/lib/types"
import { headers } from "next/headers"
import { getCurrentMonthToDateTokyo } from "@/lib/date-range"

export async function TopProductsTable() {
  const h = await headers()
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000'
  const proto = h.get('x-forwarded-proto') || (process.env.VERCEL ? 'https' : 'http')
  const base = `${proto}://${host}`
  const cur = getCurrentMonthToDateTokyo()

  const resCur = await fetch(`${base}/api/gas/products?from=${cur.from}&to=${cur.to}`, { cache: 'no-store' })
  const dataCur = (await resCur.json()) as ProductsResponse
  const curItems = 'items' in dataCur ? dataCur.items : []

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
    inventoryHealth: String(it.inventoryHealth ?? it.stockHealth ?? ''),
  })

  const curMap = new Map(curItems.map((it: any) => [String(it.sku || ''), normalize(it)]))
  const merged = Array.from(curMap.values()).map((c) => ({
    sku: c.sku,
    name: c.name,
    orders: c.orders,
    revenue: c.revenue,
    profit: c.profit,
    profitRate: c.profitRate,
    stock: c.stock,
    inventoryHealth: c.inventoryHealth,
  }))

  const topProducts = merged
    .slice()
    .sort((a, b) => (b.profit ?? 0) - (a.profit ?? 0) || (b.revenue ?? 0) - (a.revenue ?? 0))
    .slice(0, 10)

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">トップ商品（利益順）</CardTitle>
        <p className="text-sm text-muted-foreground">今月（{cur.ym}）の集計</p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">SKU</TableHead>
              <TableHead className="text-muted-foreground">商品名</TableHead>
              <TableHead className="text-muted-foreground text-right">注文件数</TableHead>
              <TableHead className="text-muted-foreground text-right">売上</TableHead>
              <TableHead className="text-muted-foreground text-right">利益</TableHead>
              <TableHead className="text-muted-foreground text-right">利益率</TableHead>
              <TableHead className="text-muted-foreground text-right">在庫</TableHead>
              <TableHead className="text-muted-foreground">状態</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topProducts.map((product) => (
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
                    {product.name}
                  </Link>
                </TableCell>
                <TableCell className="text-right">{product.orders}</TableCell>
                <TableCell className="text-right">¥{Math.round(product.revenue).toLocaleString()}</TableCell>
                <TableCell className="text-right font-semibold">
                  <span className={product.profit >= 0 ? "text-green-500" : "text-red-500"}>
                    ¥{Math.round(product.profit).toLocaleString()}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {product.profitRate >= 0 ? (
                      <ArrowUpRight className="h-3 w-3 text-green-500" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-red-500" />
                    )}
                    <span className={product.profitRate >= 0 ? "text-green-500" : "text-red-500"}>
                      {product.profitRate.toFixed(1)}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">{product.stock}</TableCell>
                <TableCell>
                  {product.inventoryHealth === "不足" && (
                    <Badge variant="destructive" className="text-xs">
                      在庫不足
                    </Badge>
                  )}
                  {product.inventoryHealth === "out_of_stock" && (
                    <Badge variant="destructive" className="text-xs">
                      在庫切れ
                    </Badge>
                  )}
                  {!product.inventoryHealth && (
                    <Badge variant="secondary" className="text-xs">
                      正常
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
