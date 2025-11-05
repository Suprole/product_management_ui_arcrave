"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Package, TrendingUp, ShoppingCart, Star, Loader2, ExternalLink } from "lucide-react"
import Link from "next/link"
import { ProductSalesChart } from "./product-sales-chart"
import { ProductInventoryChart } from "./product-inventory-chart"
import { ProductCartWinChart } from "./product-cart-win-chart"

type ProductData = {
  productName: string
  sku: string
  asin: string
  category: string
  currentStock: number
  totalSales: number
  orderCount: number
  price: number
  cost: number
  totalProfit: number
  profitRate: number
  rating: string | null
  salesQuantity: number
  unitProfit: number
}

type DailySales = {
  date: string
  totalSales: number
  totalProfit: number
  salesQuantity: number
  orderCount: number
}

type InventoryHistory = {
  date: string
  stock: number
}

type CartRow = {
  label: string
  value: number
}

export function ProductDetailView({ sku }: { sku: string }) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [product, setProduct] = useState<ProductData | null>(null)
  const [dailySales, setDailySales] = useState<DailySales[]>([])
  const [inventoryHistory, setInventoryHistory] = useState<InventoryHistory[]>([])
  const [cartRows, setCartRows] = useState<CartRow[]>([])
  const [periodText, setPeriodText] = useState<string>('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const res = await fetch(`/api/gas/product/${encodeURIComponent(sku)}`, { cache: 'no-store' })
        const data = await res.json()
        
        if (!data || data.error) {
          setError('商品が見つかりませんでした')
          return
        }

        const kpis = data.kpis || {}
        const series = data.series || {}
        const periodFrom = data.periodFrom || ''
        const periodTo = data.periodTo || ''
        const periodTextValue = periodFrom && periodTo ? `${periodFrom} ～ ${periodTo}` : ''
        const rating = data.rating || null
        
        const productData: ProductData = {
          productName: data.name || '',
          sku: data.sku || sku,
          asin: data.asin || '',
          category: data.category || '',
          currentStock: kpis.stockCurrent ?? kpis.stockEnd ?? 0,
          totalSales: Math.round(kpis.revenue ?? 0),
          orderCount: Math.round(kpis.units ?? 0),
          price: Math.round((data.price ?? 0) || 0),
          cost: Math.round((data.cost ?? 0) || 0),
          totalProfit: Math.round((data.totalProfit ?? 0) || 0),
          profitRate: typeof data.profitRate === 'number' ? data.profitRate : ((kpis.revenue ? ((data.totalProfit ?? 0) / (kpis.revenue || 1)) * 100 : 0)),
          rating: rating,
          salesQuantity: Math.round(kpis.units ?? 0),
          unitProfit: Math.round((data.unitProfit ?? (kpis.revenue ? ((data.totalProfit ?? 0) / (kpis.units || 1)) : 0)) || 0),
        }

        const mapByDate = (arr: any[]) => {
          const m: Record<string, number> = {}
          arr.forEach((x: any) => { m[x.date] = x.value })
          return m
        }
        
        const rev = mapByDate(series.revenueDaily || [])
        const prf = mapByDate(series.profitDaily || [])
        const dates = Object.keys(rev).sort()
        const dailySalesData = dates.map((d) => ({
          date: d,
          totalSales: rev[d] || 0,
          totalProfit: prf[d] || 0,
          salesQuantity: 0,
          orderCount: 0,
        }))
        
        const inventoryHistoryData = (series.stockDaily || []).map((p: any) => ({ 
          date: p.date, 
          stock: p.value 
        }))
        
        const cartRowsData = [
          { label: '7日', value: (data.kpis?.buybox7d ?? 0) * 100 },
          { label: '30日', value: (data.kpis?.buybox30d ?? 0) * 100 },
          { label: '全期間', value: (data.kpis?.buyboxAll ?? 0) * 100 },
        ]

        setProduct(productData)
        setDailySales(dailySalesData)
        setInventoryHistory(inventoryHistoryData)
        setCartRows(cartRowsData)
        setPeriodText(periodTextValue)
      } catch (err) {
        console.error('商品データの取得に失敗しました:', err)
        setError('データの取得に失敗しました')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [sku])

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{error}</p>
        <Link href="/products" className="text-blue-500 hover:underline mt-4 inline-block">
          商品一覧に戻る
        </Link>
      </div>
    )
  }

  if (isLoading || !product) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 p-4 bg-blue-500/10 rounded-lg">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          <div>
            <p className="font-semibold text-blue-500">商品詳細を読み込んでいます...</p>
            <p className="text-sm text-muted-foreground">SKU: {sku}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/products"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            商品一覧に戻る
          </Link>
        </div>

        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-5 w-48" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-6 w-24 mb-4" />
              <div className="space-y-3">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="flex justify-between">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-64 w-full" />
        </Card>
      </div>
    )
  }

  

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/products"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          商品一覧に戻る
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <a 
            href={`https://www.amazon.co.jp/dp/${product.asin}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-3xl font-bold hover:text-blue-600 transition-colors group"
          >
            {product.productName}
            <ExternalLink className="h-6 w-6 opacity-60 group-hover:opacity-100 transition-opacity" />
          </a>
          <p className="text-muted-foreground mt-2">
            SKU: {product.sku} | ASIN: {product.asin}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant={product.currentStock === 0 ? "destructive" : product.currentStock < 20 ? "secondary" : "default"}
          >
            {product.currentStock === 0 ? "在庫切れ" : product.currentStock < 20 ? "在庫不足" : "在庫あり"}
          </Badge>
          <Link href={`/orders/create?sku=${product.sku}`}>
            <Button 
              size="default" 
              className="flex items-center gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              この商品を発注する
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Package className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">現在在庫</p>
              <p className="text-2xl font-bold">{product.currentStock}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">総売上</p>
              <p className="text-2xl font-bold">¥{product.totalSales.toLocaleString()}</p>
              {periodText && (
                <p className="text-xs text-muted-foreground mt-1">{periodText}</p>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">注文件数</p>
              <p className="text-2xl font-bold">{product.orderCount}</p>
              {periodText && (
                <p className="text-xs text-muted-foreground mt-1">{periodText}</p>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-500/10 rounded-lg">
              <Star className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">評価</p>
              <p className="text-2xl font-bold">{product.rating || '評価なし'}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">商品情報</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">カテゴリー</span>
              <span className="font-medium">{product.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">販売価格</span>
              <span className="font-medium">¥{product.price.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">原価</span>
              <span className="font-medium">¥{product.cost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">販売数量</span>
              <span className="font-medium">{product.salesQuantity}個</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">収益情報</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">総利益</span>
              <span className={`font-medium ${product.totalProfit >= 0 ? "text-green-500" : "text-red-500"}`}>
                ¥{product.totalProfit.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">利益率</span>
              <span className={`font-medium ${product.profitRate >= 0 ? "text-green-500" : "text-red-500"}`}>
                {product.profitRate.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">商品単価利益</span>
              <span className="font-medium">¥{product.unitProfit.toLocaleString()}</span>
            </div>
          </div>
        </Card>
      </div>

      <ProductSalesChart data={dailySales} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProductInventoryChart data={inventoryHistory} />
        <ProductCartWinChart rows={cartRows} />
      </div>
    </div>
  )
}
