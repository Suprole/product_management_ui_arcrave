'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { getOrderCartItem, upsertOrderCartItem } from '@/lib/order-cart'
import { Loader2 } from 'lucide-react'

export function OrderCreateView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const skuFromUrl = searchParams.get('sku')
  const [isAutoLoading, setIsAutoLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!skuFromUrl) return

    const addSkuToCart = async () => {
      setIsAutoLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({ sku: skuFromUrl })
        const res = await fetch(`/api/gas/products/search?${params.toString()}`, { cache: 'no-store' })
        const data = await res.json()

        if (!res.ok || 'error' in data || !data.items?.length) {
          throw new Error(data?.error || '商品検索に失敗しました')
        }

        const product = data.items[0]
        const existingItem = getOrderCartItem(skuFromUrl)
        upsertOrderCartItem({
          ...product,
          setCount: existingItem?.setCount ?? product.minLot,
          taxRate: existingItem?.taxRate ?? 0.1,
          remarks: existingItem?.remarks ?? '',
        })

        router.replace(`/orders/cart?addedSku=${encodeURIComponent(skuFromUrl)}`)
      } catch (err) {
        setError(err instanceof Error ? err.message : '商品のカート追加に失敗しました')
      } finally {
        setIsAutoLoading(false)
      }
    }

    addSkuToCart()
  }, [router, skuFromUrl])

  if (isAutoLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-lg font-medium">発注カートへ商品を追加しています...</p>
              {skuFromUrl && <p className="text-sm text-muted-foreground">SKU: {skuFromUrl}</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>発注作成ルートはカート方式に移行しました</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            現在は複数商品をまとめて発注できるカート方式を採用しています。
            商品一覧や在庫一覧から商品をカートへ追加し、発注カート画面で数量を調整してください。
          </p>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex flex-wrap gap-3">
            <Link href="/orders/cart">
              <Button>発注カートへ移動</Button>
            </Link>
            <Link href="/products">
              <Button variant="outline">商品一覧へ戻る</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

