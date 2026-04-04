'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, ChevronLeft, ChevronRight, Loader2, RefreshCw, ShoppingCart, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

type SuccessState = {
  batchId: string
  poIds: string[]
  createdCount: number
  subtotal: number
  total: number
  mailSentCount: number
  mailError?: string
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
  const [refreshingProducts, setRefreshingProducts] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [successState, setSuccessState] = useState<SuccessState | null>(null)
  const [submitProgress, setSubmitProgress] = useState(0)
  const [submitStage, setSubmitStage] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

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
  const totalPages = Math.max(1, Math.ceil(itemStates.length / rowsPerPage))
  const pageStart = (currentPage - 1) * rowsPerPage
  const pagedItemStates = itemStates.slice(pageStart, pageStart + rowsPerPage)

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

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
    setSubmitProgress(10)
    setSubmitStage('発注データを送信しています...')
    setConfirmOpen(false)

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

      setSubmitProgress(65)
      setSubmitStage('発注を作成しました。依頼メールを送信しています...')

      const mailRes = await fetch('/api/gas/orders/mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'request',
          poIds: data.poIds,
        }),
      })

      const mailData = await mailRes.json()
      const mailError =
        !mailRes.ok || ('error' in mailData && mailData.error)
          ? ('error' in mailData && mailData.error) || '依頼メール送信に失敗しました'
          : null

      setSubmitProgress(100)
      setSubmitStage(mailError ? '発注は完了しましたが、依頼メール送信に失敗しました。' : '依頼メール送信が完了しました。')

      clearCart()
      setSuccessState({
        batchId: data.batchId,
        poIds: data.poIds,
        createdCount: data.createdCount,
        subtotal: summary.subtotal,
        total: summary.total,
        mailSentCount: mailError ? 0 : Number(mailData.sentCount || 0),
        mailError: mailError || undefined,
      })

      if (mailError) {
        toast({
          title: '発注は完了しました',
          description: `発注 ${data.createdCount}件は作成済みですが、依頼メール送信でエラーが発生しました。`,
          variant: 'destructive',
        })
      } else {
        toast({
          title: '一括発注が完了しました',
          description: `${data.createdCount}件の発注を作成し、依頼メールを送信しました`,
        })
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : '一括発注に失敗しました')
      setSubmitProgress(0)
      setSubmitStage('')
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

          <div className="grid gap-4 md:grid-cols-4">
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
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">依頼メール送信</p>
                <p className="text-2xl font-bold">{successState.mailError ? '失敗' : `${successState.mailSentCount}件`}</p>
              </CardContent>
            </Card>
          </div>

          {successState.mailError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                発注作成は完了していますが、依頼メール送信に失敗しました。発注一覧から再送してください。
              </AlertDescription>
            </Alert>
          )}

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
            <Button variant="outline" onClick={handleRefreshProducts} disabled={refreshingProducts || submitting}>
              {refreshingProducts ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              最新情報で再計算
            </Button>
            <Button variant="outline" onClick={() => clearCart()} disabled={submitting}>
              <Trash2 className="mr-2 h-4 w-4" />
              カートを空にする
            </Button>
            <Button onClick={() => setConfirmOpen(true)} disabled={hasInvalidItems || submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {submitting ? '処理中...' : '一括発注する'}
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

          {submitting && (
            <div className="rounded-lg border bg-muted/40 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">一括発注を処理中です</p>
                  <p className="text-sm text-muted-foreground">{submitStage}</p>
                </div>
                <span className="text-sm font-medium">{submitProgress}%</span>
              </div>
              <Progress value={submitProgress} className="mt-3 h-3" />
            </div>
          )}

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-muted-foreground">
              {itemStates.length}件中 {pageStart + 1} - {Math.min(pageStart + rowsPerPage, itemStates.length)}件を表示
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">表示件数</span>
              <Select
                value={String(rowsPerPage)}
                onValueChange={(value) => {
                  setRowsPerPage(Number(value))
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger size="sm" className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10件</SelectItem>
                  <SelectItem value="20">20件</SelectItem>
                  <SelectItem value="50">50件</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[280px]">商品</TableHead>
                  <TableHead className="min-w-[110px]">セット数</TableHead>
                  <TableHead className="min-w-[110px]">税率</TableHead>
                  <TableHead className="text-right">合計個数</TableHead>
                  <TableHead className="text-right">単価</TableHead>
                  <TableHead className="text-right">税抜</TableHead>
                  <TableHead className="min-w-[220px]">備考</TableHead>
                  <TableHead>状態</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedItemStates.map(({ item, validation, quantity, subtotal }) => (
                  <TableRow key={item.sku} className={!validation.isValid ? 'bg-red-50/60 dark:bg-red-950/20' : ''}>
                    <TableCell className="align-top">
                      <div className="space-y-1 whitespace-normal">
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
                        <p className="text-xs text-muted-foreground">ASIN: {item.asin}</p>
                        <p>最小ロット: {item.minLot}セット</p>
                        <p>セット個数: {item.setSize}個</p>
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <Input
                        id={`cart-set-count-${item.sku}`}
                        type="number"
                        min={item.minLot}
                        step={item.minLot}
                        value={String(item.setCount)}
                        onChange={(event) =>
                          handleFieldChange(item.sku, { setCount: Number(event.target.value || 0) })
                        }
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="flex items-center gap-1">
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
                          className="w-20"
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right align-top font-medium">{quantity}個</TableCell>
                    <TableCell className="text-right align-top">¥{item.unitPrice.toLocaleString()}</TableCell>
                    <TableCell className="text-right align-top font-medium">¥{subtotal.toLocaleString()}</TableCell>
                    <TableCell className="align-top">
                      <Input
                        id={`cart-remarks-${item.sku}`}
                        value={item.remarks}
                        onChange={(event) => handleFieldChange(item.sku, { remarks: event.target.value })}
                        placeholder="備考"
                        className="min-w-[180px]"
                      />
                    </TableCell>
                    <TableCell className="align-top">
                      {validation.isValid ? (
                        <Badge variant="outline">OK</Badge>
                      ) : (
                        <div className="space-y-1 whitespace-normal">
                          <Badge variant="destructive">要修正</Badge>
                          <p className="text-xs text-red-600 dark:text-red-400">{validation.errors[0]}</p>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right align-top">
                      <Button variant="ghost" size="sm" onClick={() => removeItem(item.sku)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        削除
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 border-t pt-4 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-muted-foreground">
              ページ {currentPage} / {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                前へ
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
              >
                次へ
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>一括発注を実行しますか？</AlertDialogTitle>
            <AlertDialogDescription>{items.length}件の SKU について発注を作成します。</AlertDialogDescription>
          </AlertDialogHeader>

          <div className="max-h-96 space-y-3 overflow-y-auto">
            {itemStates.map(({ item, quantity, subtotal }) => (
              <div key={item.sku} className="rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-muted-foreground">SKU: {item.sku}</p>
                  </div>
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
