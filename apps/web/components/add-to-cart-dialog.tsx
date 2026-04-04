'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, ShoppingCart, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { upsertOrderCartItem, useOrderCart } from '@/lib/order-cart'
import type { ProductSearchResult } from '@/lib/types'

type AddToCartButtonProps = {
  sku: string
  label?: string
  size?: 'sm' | 'default' | 'lg'
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'link'
  className?: string
}

export function AddToCartButton({
  sku,
  label = 'カートに追加',
  size = 'sm',
  variant = 'outline',
  className,
}: AddToCartButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [product, setProduct] = useState<ProductSearchResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [setCount, setSetCount] = useState('1')
  const [taxRate, setTaxRate] = useState('10')
  const [remarks, setRemarks] = useState('')
  const { toast } = useToast()
  const { getItem } = useOrderCart()

  const existingItem = useMemo(() => getItem(sku), [getItem, sku, open])

  useEffect(() => {
    if (!open) return

    const loadProduct = async () => {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({ sku })
        const res = await fetch(`/api/gas/products/search?${params.toString()}`, { cache: 'no-store' })
        const data = await res.json()

        if (!res.ok || 'error' in data || !data.items?.length) {
          throw new Error(data?.error || '商品情報の取得に失敗しました')
        }

        const nextProduct = data.items[0] as ProductSearchResult
        const cartItem = getOrderCartItem(sku)

        setProduct(nextProduct)
        setSetCount(String(cartItem?.setCount ?? nextProduct.minLot))
        setTaxRate(String((cartItem?.taxRate ?? 0.1) * 100))
        setRemarks(cartItem?.remarks ?? '')
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : '商品情報の取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
  }, [open, sku])

  const numericSetCount = Number(setCount || 0)
  const numericTaxRate = Number(taxRate || 0) / 100
  const validation = product
    ? validateCartItem({
        setCount: numericSetCount,
        minLot: product.minLot,
        setSize: product.setSize,
        purchasePrice: product.purchasePrice,
      })
    : { isValid: false, errors: [] }

  const quantity = product ? numericSetCount * product.setSize : 0
  const subtotal = product ? product.unitPrice * quantity : 0
  const tax = subtotal * numericTaxRate
  const total = subtotal + tax

  const handleSubmit = () => {
    if (!product || !validation.isValid) return

    upsertOrderCartItem({
      ...product,
      setCount: numericSetCount,
      taxRate: numericTaxRate,
      remarks,
    })

    toast({
      title: existingItem ? 'カートを更新しました' : 'カートに追加しました',
      description: `${product.name} を発注カートへ反映しました`,
    })

    setOpen(false)
  }

  return (
    <>
      <Button size={size} variant={variant} className={className} onClick={() => setOpen(true)}>
        {existingItem ? <Check className="mr-2 h-4 w-4" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
        {existingItem ? '追加済' : label}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>発注カートに追加</DialogTitle>
            <DialogDescription>セット数や税率を確認して、カートへ追加します。</DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center gap-3 py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              商品情報を読み込んでいます...
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : product ? (
            <div className="space-y-6">
              <div className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      SKU: {product.sku} / ASIN: {product.asin}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {product.hazard && <Badge variant="destructive">危険物</Badge>}
                    {product.hasExpiry && <Badge variant="outline">期限管理あり</Badge>}
                  </div>
                </div>
                <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
                  <div>
                    <p className="text-muted-foreground">最小ロット</p>
                    <p className="font-medium">{product.minLot}セット</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">セット個数</p>
                    <p className="font-medium">{product.setSize}個</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">仕入れ値</p>
                    <p className="font-medium">¥{product.purchasePrice.toLocaleString()}/セット</p>
                  </div>
                </div>
              </div>

              {existingItem && (
                <Alert>
                  <AlertDescription>
                    この SKU は既にカートに入っています。今回の内容で上書きされます。
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`set-count-${sku}`}>発注セット数</Label>
                  <Input
                    id={`set-count-${sku}`}
                    type="number"
                    min={product.minLot}
                    step={product.minLot}
                    value={setCount}
                    onChange={(event) => setSetCount(event.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    最小ロット {product.minLot} セットの倍数で指定してください
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`tax-rate-${sku}`}>消費税率 (%)</Label>
                  <Input
                    id={`tax-rate-${sku}`}
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={taxRate}
                    onChange={(event) => setTaxRate(event.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`remarks-${sku}`}>備考</Label>
                <Textarea
                  id={`remarks-${sku}`}
                  rows={3}
                  value={remarks}
                  onChange={(event) => setRemarks(event.target.value)}
                  placeholder="必要があれば備考を入力"
                />
              </div>

              {!validation.isValid && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{validation.errors[0]}</AlertDescription>
                </Alert>
              )}

              <div className="rounded-lg bg-muted p-4">
                <h4 className="font-semibold">計算結果</h4>
                <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">合計個数</span>
                    <span className="font-medium">{quantity}個</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">税抜金額</span>
                    <span className="font-medium">¥{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">消費税</span>
                    <span>¥{Math.round(tax).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">税込合計</span>
                    <span className="font-semibold">¥{Math.round(total).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleSubmit} disabled={loading || !product || !validation.isValid}>
              カートに追加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
