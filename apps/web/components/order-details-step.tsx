'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ChevronLeft, AlertCircle } from 'lucide-react'
import type { ProductSearchResult } from '@/lib/types'

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
  
  // 計算値
  const setCountNum = parseInt(setCount) || 0
  const taxRateNum = parseFloat(taxRate) || 0
  const quantity = setCountNum * product.setSize
  const subtotal = product.unitPrice * quantity
  const tax = subtotal * (taxRateNum / 100)
  const total = subtotal + tax
  
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
              <span className="text-muted-foreground">最小ロット:</span>
              <p>{product.minLot}セット</p>
            </div>
            <div>
              <span className="text-muted-foreground">仕入れ値（/セット）:</span>
              <p className="font-medium">¥{product.purchasePrice.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
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
    </>
  )
}

