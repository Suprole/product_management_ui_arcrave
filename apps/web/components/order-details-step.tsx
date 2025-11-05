'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
import { ChevronLeft, AlertCircle, AlertTriangle } from 'lucide-react'
import type { ProductSearchResult, Order } from '@/lib/types'

interface OrderDetailsStepProps {
  product: ProductSearchResult
  onComplete: (data: { setCount: number; taxRate: number; remarks: string }) => void
  onBack: () => void
}

export function OrderDetailsStep({ product, onComplete, onBack }: OrderDetailsStepProps) {
  const [setCount, setSetCount] = useState(product.minLot.toString())
  const [taxRate, setTaxRate] = useState('10')
  const [remarks, setRemarks] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [existingOrders, setExistingOrders] = useState<Order[]>([])
  const [isCheckingOrders, setIsCheckingOrders] = useState(true)
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false)
  
  // 計算値
  const setCountNum = parseInt(setCount) || 0
  const taxRateNum = parseFloat(taxRate) || 0
  const quantity = setCountNum * product.setSize
  const subtotal = product.unitPrice * quantity
  const tax = subtotal * (taxRateNum / 100)
  const total = subtotal + tax
  
  // 既存の依頼中発注をチェック
  useEffect(() => {
    const checkExistingOrders = async () => {
      setIsCheckingOrders(true)
      try {
        const params = new URLSearchParams({
          sku: product.sku,
          statuses: 'sup_依頼中',
        })
        const res = await fetch(`/api/gas/orders?${params.toString()}`)
        
        if (!res.ok) {
          console.error('既存発注の取得に失敗しました')
          return
        }
        
        const data = await res.json()
        
        if ('error' in data) {
          console.error('既存発注の取得エラー:', data.error)
          return
        }
        
        // 依頼中の発注のみをフィルタ
        const pendingOrders = (data.items || []).filter(
          (order: Order) => order.status === 'sup_依頼中'
        )
        
        setExistingOrders(pendingOrders)
      } catch (err) {
        console.error('既存発注のチェックに失敗しました:', err)
      } finally {
        setIsCheckingOrders(false)
      }
    }
    
    checkExistingOrders()
  }, [product.sku])
  
  // 最小ロットチェック
  useEffect(() => {
    if (setCountNum > 0 && product.minLot > 0 && setCountNum % product.minLot !== 0) {
      setError(
        `セット数は最小ロット（${product.minLot}セット）の倍数で指定してください`
      )
    } else if (setCountNum <= 0) {
      setError('セット数は1以上を指定してください')
    } else {
      setError(null)
    }
  }, [setCountNum, product.minLot])
  
  const proceedToNext = () => {
    onComplete({
      setCount: setCountNum,
      taxRate: taxRateNum / 100, // パーセントを小数に変換
      remarks,
    })
  }
  
  const handleNext = () => {
    if (error) return
    if (setCountNum <= 0) return
    
    // 依頼中の発注がある場合は確認ダイアログを表示
    if (existingOrders.length > 0) {
      setShowDuplicateDialog(true)
      return
    }
    
    // 重複がない場合は直接次へ
    proceedToNext()
  }
  
  const handleConfirmDuplicate = () => {
    setShowDuplicateDialog(false)
    proceedToNext()
  }
  
  return (
    <>
      {/* 選択商品情報 */}
      <Card>
        <CardHeader>
          <CardTitle>選択した商品</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">商品名:</span>
              <p className="font-medium">{product.name}</p>
            </div>
            <div>
              <span className="text-muted-foreground">SKU:</span>
              <p className="font-mono">{product.sku}</p>
            </div>
            <div>
              <span className="text-muted-foreground">ASIN:</span>
              <p className="font-mono">{product.asin}</p>
            </div>
            <div>
              <span className="text-muted-foreground">ブランド:</span>
              <p>{product.brand || '-'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">セット個数:</span>
              <p>{product.setSize}個/セット</p>
            </div>
            <div>
              <span className="text-muted-foreground">最小ロット:</span>
              <p>{product.minLot}セット</p>
            </div>
            <div>
              <span className="text-muted-foreground">仕入れ値（/セット）:</span>
              <p className="font-medium">¥{product.purchasePrice.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-muted-foreground">単価（/個）:</span>
              <p className="font-medium">¥{product.unitPrice.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 既存の依頼中発注アラート */}
      {!isCheckingOrders && existingOrders.length > 0 && (
        <Alert variant="default" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          <AlertTitle className="text-yellow-900 dark:text-yellow-100 font-semibold">
            依頼中の発注があります
          </AlertTitle>
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            <p className="mb-2">
              この商品には既に依頼中の発注が{existingOrders.length}件あります。
              重複発注にご注意ください。
            </p>
            <div className="space-y-2 mt-3">
              {existingOrders.map((order) => (
                <div
                  key={order.po_id}
                  className="p-2 bg-white dark:bg-gray-900 rounded border border-yellow-200 dark:border-yellow-800 text-sm"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">PO番号: {order.po_id}</p>
                      <p className="text-xs text-muted-foreground">
                        発注日: {order.orderDate}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{order.quantity}個</p>
                      <p className="text-xs text-muted-foreground">
                        ({order.setCount}セット)
                      </p>
                    </div>
                  </div>
                  {order.remarks && (
                    <p className="text-xs text-muted-foreground mt-1">
                      備考: {order.remarks}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      {/* 発注数量入力 */}
      <Card>
        <CardHeader>
          <CardTitle>発注数量</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* セット数 */}
          <div className="space-y-2">
            <Label htmlFor="setCount">
              発注セット数 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="setCount"
              type="number"
              min={product.minLot}
              step={product.minLot}
              value={setCount}
              onChange={(e) => setSetCount(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              最小ロット: {product.minLot}セットの倍数で指定してください
            </p>
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
          
          {/* 消費税率 */}
          <div className="space-y-2">
            <Label htmlFor="taxRate">消費税率 (%)</Label>
            <Input
              id="taxRate"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
            />
          </div>
          
          {/* 備考 */}
          <div className="space-y-2">
            <Label htmlFor="remarks">備考</Label>
            <Textarea
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="備考があれば入力..."
              rows={3}
            />
          </div>
          
          {/* 計算結果 */}
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <h4 className="font-semibold">計算結果</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">発注数量:</span>
                <span className="font-medium">{quantity}個</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">単価:</span>
                <span>¥{product.unitPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between col-span-2">
                <span className="text-muted-foreground">税抜金額:</span>
                <span className="font-medium">¥{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between col-span-2">
                <span className="text-muted-foreground">消費税（{taxRateNum}%）:</span>
                <span>¥{Math.round(tax).toLocaleString()}</span>
              </div>
              <div className="flex justify-between col-span-2 pt-2 border-t">
                <span className="font-semibold">税込合計:</span>
                <span className="font-bold text-lg">
                  ¥{Math.round(total).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* ボタン */}
      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          戻る
        </Button>
        <Button onClick={handleNext} disabled={!!error || setCountNum <= 0} className="flex-1">
          次へ（確認）
        </Button>
      </div>
      
      {/* 重複発注確認ダイアログ */}
      <AlertDialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              依頼中の発注があります
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p className="text-base">
                この商品には既に依頼中の発注が<strong className="text-foreground">{existingOrders.length}件</strong>あります。
              </p>
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {existingOrders.map((order) => (
                  <div
                    key={order.po_id}
                    className="p-3 bg-muted rounded-lg text-sm border"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <p className="font-medium text-foreground">PO番号: {order.po_id}</p>
                        <p className="text-xs text-muted-foreground">
                          発注日: {order.orderDate}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-foreground">{order.quantity}個</p>
                        <p className="text-xs text-muted-foreground">
                          ({order.setCount}セット)
                        </p>
                      </div>
                    </div>
                    {order.remarks && (
                      <p className="text-xs text-muted-foreground mt-1">
                        備考: {order.remarks}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              
              <p className="text-base font-medium text-foreground pt-2">
                それでも新しい発注を作成しますか？
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDuplicate} className="bg-yellow-600 hover:bg-yellow-700">
              発注を続行する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

