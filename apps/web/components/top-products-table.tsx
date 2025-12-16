import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"
import Link from "next/link"
import { ProductsResponse } from "@/lib/types"
import { headers } from "next/headers"
import { getCurrentMonthToDateTokyo, getPreviousMonthTokyo } from "@/lib/date-range"

export async function TopProductsTable() {
  const h = await headers()
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000'
  const proto = h.get('x-forwarded-proto') || (process.env.VERCEL ? 'https' : 'http')
  const base = `${proto}://${host}`
  const cur = getCurrentMonthToDateTokyo()
  const prev = getPreviousMonthTokyo()

  const [resPrev, resCur] = await Promise.all([
    fetch(`${base}/api/gas/products?from=${prev.from}&to=${prev.to}`, { cache: 'no-store' }),
    fetch(`${base}/api/gas/products?from=${cur.from}&to=${cur.to}`, { cache: 'no-store' }),
  ])

  const [dataPrev, dataCur] = await Promise.all([
    resPrev.json() as Promise<ProductsResponse>,
    resCur.json() as Promise<ProductsResponse>,
  ])

  const prevItems = 'items' in dataPrev ? dataPrev.items : []
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

  const prevMap = new Map(prevItems.map((it: any) => [String(it.sku || ''), normalize(it)]))
  const curMap = new Map(curItems.map((it: any) => [String(it.sku || ''), normalize(it)]))
  const skus = Array.from(new Set([...prevMap.keys(), ...curMap.keys()])).filter(Boolean)

  const merged = skus.map((sku) => {
    const p = prevMap.get(sku)
    const c = curMap.get(sku)
    return {
      sku,
      name: c?.name || p?.name || '',
      ordersPrev: p?.orders ?? 0,
      ordersCur: c?.orders ?? 0,
      revenuePrev: p?.revenue ?? 0,
      revenueCur: c?.revenue ?? 0,
      profitCur: c?.profit ?? 0,
      profitRateCur: c?.profitRate ?? 0,
      stock: c?.stock ?? p?.stock ?? 0,
      inventoryHealth: c?.inventoryHealth || p?.inventoryHealth || '',
    }
  })

  const topProducts = merged
    .slice()
    .sort((a, b) => (b.profitCur ?? 0) - (a.profitCur ?? 0) || (b.revenueCur ?? 0) - (a.revenueCur ?? 0))
    .slice(0, 10)

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">トップ商品（利益順・今月）</CardTitle>
        <p className="text-sm text-muted-foreground">
          前月（{prev.ym}）と今月（{cur.ym}）の注文件数・売上を比較
        </p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">SKU</TableHead>
              <TableHead className="text-muted-foreground">商品名</TableHead>
              <TableHead className="text-muted-foreground text-right">注文件数（前月）</TableHead>
              <TableHead className="text-muted-foreground text-right">注文件数（今月）</TableHead>
              <TableHead className="text-muted-foreground text-right">売上（前月）</TableHead>
              <TableHead className="text-muted-foreground text-right">売上（今月）</TableHead>
              <TableHead className="text-muted-foreground text-right">利益（今月）</TableHead>
              <TableHead className="text-muted-foreground text-right">利益率（今月）</TableHead>
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
                <TableCell className="text-right">{product.ordersPrev}</TableCell>
                <TableCell className="text-right font-semibold">{product.ordersCur}</TableCell>
                <TableCell className="text-right">¥{Math.round(product.revenuePrev).toLocaleString()}</TableCell>
                <TableCell className="text-right font-semibold">¥{Math.round(product.revenueCur).toLocaleString()}</TableCell>
                <TableCell className="text-right font-semibold">
                  <span className={product.profitCur >= 0 ? "text-green-500" : "text-red-500"}>
                    ¥{Math.round(product.profitCur).toLocaleString()}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {product.profitRateCur >= 0 ? (
                      <ArrowUpRight className="h-3 w-3 text-green-500" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-red-500" />
                    )}
                    <span className={product.profitRateCur >= 0 ? "text-green-500" : "text-red-500"}>
                      {product.profitRateCur.toFixed(1)}%
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
