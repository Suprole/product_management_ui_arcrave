'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, Loader2, RefreshCw, ShoppingCart, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { useOrderCart } from '@/lib/order-cart'
import type { BatchCreateOrderResponse, CartItem, ProductSearchResult } from '@/lib/types'

type PendingCounts = Record<string, number>

type SuccessState = {
  batchId: string
  poIds: string[]
  createdCount: number
  subtotal: number
  total: number
}

function calculateLine(item: CartItem) {
  const quantity = item.setCount * item.setSize
  const subtotal = item.unitPrice * quantity
  const tax = subtotal * item.taxRate

  return {
    quantity,
    subtotal,
    tax,
    total: subtotal + tax,
  }
}

export function OrdersCartView() {
  const { toast } = useToast()
  const { items, summary, updateItem, removeItem, clearCart, validateItem } = useOrderCart()
  const [pendingCounts, setPendingCounts] = useState<PendingCounts>({})
  const [loadingPendingCounts, setLoadingPendingCounts] = useState(false)
  const [refreshingProducts, setRefreshingProducts] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [successState, setSuccessState] = useState<SuccessState | null>(null)

  const itemStates = useMemo(
    () =>
      items.map((item) => ({
        item,
        validation: validateItem(item),
        ...calculateLine(item),
      })),
    [items, validateItem],
  )

  const hasInvalidItems = itemStates.some((state) => !state.validation.isValid)

  useEffect(() => {
    if (items.length === 0) {
      setPendingCounts({})
      return
    }

    const fetchPendingCounts = async () => {
      setLoadingPendingCounts(true)

      try {
        const counts = await Promise.all(
          items.map(async (item) => {
            const params = new URLSearchParams({ sku: item.sku, statuses: '依頼中' })
            const res = await fetch(`/api/gas/orders?${params.toString()}`, { cache: 'no-store' })
            const data = await res.json()
            return [item.sku, Array.isArray(data?.items) ? data.items.length : 0] as const
          }),
        )

        setPendingCounts(Object.fromEntries(counts))
      } catch (error) {
        console.error('依頼中発注の件数取得に失敗しました:', error)
      } finally {
        setLoadingPendingCounts(false)
      }
    }

    fetchPendingCounts()
  }, [items])

  const handleFieldChange = (sku: string, patch: Partial<CartItem>) => {
    const target = items.find((item) => item.sku === sku)
    if (!target) return
    updateItem({ ...target, ...patch })
  }

  const handleRefreshProducts = async () => {
    setRefreshingProducts(true)

    try {
      await Promise.all(
        items.map(async (item) => {
          const params = new URLSearchParams({ sku: item.sku })
          const res = await fetch(`/api/gas/products/search?${params.toString()}`, { cache: 'no-store' })
          const data = await res.json()
          const latest = data?.items?.[0] as ProductSearchResult | undefined
          if (!latest) return

          updateItem({
            ...latest,
            setCount: item.setCount,
            taxRate: item.taxRate,
            remarks: item.remarks,
          })
        }),
      )

      toast({
        title: '商品情報を更新しました',
        description: '最小ロットや仕入れ値を最新情報で再計算しました。',
      })
    } catch (error) {
      toast({
        title: '更新に失敗しました',
        description: error instanceof Error ? error.message : '商品情報の更新に失敗しました',
        variant: 'destructive',
      })
    } finally {
      setRefreshingProducts(false)
    }
  }

  const handleSubmitBatch = async () => {
    setSubmitting(true)
    setSubmitError(null)

    try {
      const res = await fetch('/api/gas/orders/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({
            sku: item.sku,
            setCount: item.setCount,
            taxRate: item.taxRate,
            remarks: item.remarks || undefined,
          })),
          seller: 'Suprole',
          createdBy: 'user@example.com',
        }),
      })

      const data = (await res.json()) as BatchCreateOrderResponse
      if (!res.ok || 'error' in data) {
        throw new Error(('error' in data && data.error) || '一括発注に失敗しました')
      }

      clearCart()
      setSuccessState({
        batchId: data.batchId,
        poIds: data.poIds,
        createdCount: data.createdCount,
        subtotal: summary.subtotal,
        total: summary.total,
      })
      setConfirmOpen(false)
      toast({
        title: '一括発注が完了しました',
        description: `${data.createdCount}件の発注を作成しました`,
      })
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : '一括発注に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  if (successState) {
    return (
      <Card className="max-w-4xl mx-auto border-green-200 bg-green-50/50">
        <CardContent className="space-y-6 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-green-900">一括発注が完了しました</h2>
            <p className="mt-2 text-sm text-green-800">
              batchId: <span className="font-mono font-semibold">{successState.batchId}</span>
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">作成件数</p>
                <p className="text-2xl font-bold">{successState.createdCount}件</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">税抜合計</p>
                <p className="text-2xl font-bold">¥{Math.round(successState.subtotal).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">税込合計</p>
                <p className="text-2xl font-bold">¥{Math.round(successState.total).toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>

          <div className="rounded-lg border bg-background p-4">
            <p className="font-semibold">作成された発注ID</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {successState.poIds.map((poId) => (
                <Badge key={poId} variant="outline" className="font-mono">
                  {poId}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href={`/orders?batchId=${encodeURIComponent(successState.batchId)}`}>
              <Button>この batchId の発注を見る</Button>
            </Link>
            <Link href="/orders">
              <Button variant="outline">発注一覧へ戻る</Button>
            </Link>
            <Link href="/products">
              <Button variant="ghost">商品一覧へ戻る</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (items.length === 0) {
    return (
      <Card className="max-w-3xl mx-auto">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <ShoppingCart className="h-12 w-12 text-muted-foreground" />
          <div>
            <h2 className="text-xl font-semibold">発注カートは空です</h2>
            <p className="text-sm text-muted-foreground">
              商品一覧や在庫一覧から商品を追加して、一括で発注できます。
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/products">
              <Button>商品一覧へ</Button>
            </Link>
            <Link href="/inventory">
              <Button variant="outline">在庫一覧へ</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">SKU数</p>
            <p className="text-2xl font-bold">{summary.itemCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">合計個数</p>
            <p className="text-2xl font-bold">{summary.totalQuantity.toLocaleString()}個</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">税抜合計</p>
            <p className="text-2xl font-bold">¥{Math.round(summary.subtotal).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">税込合計</p>
            <p className="text-2xl font-bold">¥{Math.round(summary.total).toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>発注カート</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              商品ごとに数量や備考を調整して、一括で発注します。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleRefreshProducts} disabled={refreshingProducts}>
              {refreshingProducts ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              最新情報で再計算
            </Button>
            <Button variant="outline" onClick={() => clearCart()}>
              <Trash2 className="mr-2 h-4 w-4" />
              カートを空にする
            </Button>
            <Button onClick={() => setConfirmOpen(true)} disabled={hasInvalidItems || submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              一括発注する
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {submitError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          {loadingPendingCounts && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              依頼中発注の件数を確認中...
            </div>
          )}

          <div className="space-y-4">
            {itemStates.map(({ item, validation, quantity, subtotal, tax, total }) => (
              <div key={item.sku} className="rounded-lg border p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{item.name}</p>
                      {pendingCounts[item.sku] > 0 && (
                        <Badge variant="secondary">依頼中 {pendingCounts[item.sku]}件</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      SKU: {item.sku} / ASIN: {item.asin}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span>最小ロット: {item.minLot}セット</span>
                      <span>セット個数: {item.setSize}個</span>
                      <span>単価: ¥{item.unitPrice.toLocaleString()}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeItem(item.sku)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    削除
                  </Button>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor={`cart-set-count-${item.sku}`}>セット数</Label>
                    <Input
                      id={`cart-set-count-${item.sku}`}
                      type="number"
                      min={item.minLot}
                      step={item.minLot}
                      value={String(item.setCount)}
                      onChange={(event) =>
                        handleFieldChange(item.sku, { setCount: Number(event.target.value || 0) })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`cart-tax-rate-${item.sku}`}>消費税率 (%)</Label>
                    <Input
                      id={`cart-tax-rate-${item.sku}`}
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={String(item.taxRate * 100)}
                      onChange={(event) =>
                        handleFieldChange(item.sku, { taxRate: Number(event.target.value || 0) / 100 })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>合計個数</Label>
                    <div className="rounded-md border bg-muted px-3 py-2 text-sm font-medium">
                      {quantity}個
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>税抜金額</Label>
                    <div className="rounded-md border bg-muted px-3 py-2 text-sm font-medium">
                      ¥{subtotal.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <Label htmlFor={`cart-remarks-${item.sku}`}>備考</Label>
                  <Textarea
                    id={`cart-remarks-${item.sku}`}
                    rows={2}
                    value={item.remarks}
                    onChange={(event) => handleFieldChange(item.sku, { remarks: event.target.value })}
                    placeholder="必要があれば備考を入力"
                  />
                </div>

                {!validation.isValid && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{validation.errors[0]}</AlertDescription>
                  </Alert>
                )}

                {pendingCounts[item.sku] > 0 && (
                  <Alert className="mt-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
                    <AlertTitle>依頼中の発注があります</AlertTitle>
                    <AlertDescription>
                      同じ SKU に対して既に依頼中の発注が存在します。重複発注に注意してください。
                    </AlertDescription>
                  </Alert>
                )}

                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                  <span className="text-muted-foreground">消費税: ¥{Math.round(tax).toLocaleString()}</span>
                  <span className="font-semibold">税込合計: ¥{Math.round(total).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>一括発注を実行しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              {items.length}件の SKU について発注を作成します。依頼中件数が表示されている商品は重複発注に注意してください。
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="max-h-96 space-y-3 overflow-y-auto">
            {itemStates.map(({ item, quantity, subtotal }) => (
              <div key={item.sku} className="rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-muted-foreground">SKU: {item.sku}</p>
                  </div>
                  {pendingCounts[item.sku] > 0 && <Badge variant="secondary">依頼中 {pendingCounts[item.sku]}件</Badge>}
                </div>
                <div className="mt-2 flex flex-wrap gap-4 text-muted-foreground">
                  <span>{item.setCount}セット</span>
                  <span>{quantity}個</span>
                  <span>¥{subtotal.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-lg bg-muted p-4 text-sm">
            <div className="flex justify-between">
              <span>税抜合計</span>
              <span className="font-medium">¥{Math.round(summary.subtotal).toLocaleString()}</span>
            </div>
            <div className="mt-2 flex justify-between">
              <span>税込合計</span>
              <span className="font-semibold">¥{Math.round(summary.total).toLocaleString()}</span>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>戻る</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmitBatch} disabled={submitting || hasInvalidItems}>
              {submitting ? '作成中...' : '発注を作成する'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
