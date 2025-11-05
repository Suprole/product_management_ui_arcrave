'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ChevronLeft, CheckCircle2, AlertCircle, Loader2, Mail, Package } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { ProductSearchResult } from '@/lib/types'

interface OrderConfirmStepProps {
  product: ProductSearchResult
  orderData: {
    setCount: number
    taxRate: number
    remarks: string
  }
  onSuccess: () => void
  onBack: () => void
}

export function OrderConfirmStep({ product, orderData, onSuccess, onBack }: OrderConfirmStepProps) {
  const [creating, setCreating] = useState(false)
  const [success, setSuccess] = useState(false)
  const [poId, setPoId] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(5)
  const [error, setError] = useState<string | null>(null)
  const [sendingStage, setSendingStage] = useState<'idle' | 'creating' | 'sending' | 'complete'>('idle')
  const { toast } = useToast()
  
  // 計算値
  const quantity = orderData.setCount * product.setSize
  const subtotal = product.unitPrice * quantity
  const tax = subtotal * orderData.taxRate
  const total = subtotal + tax
  
  // 成功後のカウントダウン
  useEffect(() => {
    if (success && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (success && countdown === 0) {
      onSuccess()
    }
  }, [success, countdown, onSuccess])
  
  const handleCreate = async () => {
    setCreating(true)
    setError(null)
    setSendingStage('creating')
    
    try {
      // ステージ1: 発注データ作成中
      await new Promise(resolve => setTimeout(resolve, 500)) // 視覚的フィードバックのため少し待機
      
      const res = await fetch('/api/gas/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: product.sku,
          setCount: orderData.setCount,
          taxRate: orderData.taxRate,
          seller: 'Suprole',
          remarks: orderData.remarks || undefined,
          createdBy: 'user@example.com', // TODO: 実際のユーザー情報を使用
        }),
      })
      
      // ステージ2: メール送信中
      setSendingStage('sending')
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '発注作成に失敗しました')
      }
      
      const data = await res.json()
      
      // ステージ3: 完了
      setSendingStage('complete')
      setPoId(data.po_id)
      setSuccess(true)
      
      toast({
        title: '✅ 発注作成完了',
        description: `発注ID: ${data.po_id} が作成され、依頼メールが送信されました`,
        duration: 5000,
      })
    } catch (err) {
      setSendingStage('idle')
      setError(err instanceof Error ? err.message : '発注作成に失敗しました')
      toast({
        title: '❌ エラー',
        description: err instanceof Error ? err.message : '発注作成に失敗しました',
        variant: 'destructive',
        duration: 5000,
      })
    } finally {
      setCreating(false)
    }
  }
  
  // 成功画面
  if (success) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="pt-8 pb-8">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="rounded-full bg-green-100 p-6">
              <CheckCircle2 className="h-16 w-16 text-green-600" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-green-900">
                発注作成が完了しました！
              </h3>
              <p className="text-green-800">
                依頼メールが正常に送信されました
              </p>
            </div>
            
            {poId && (
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <p className="text-sm text-muted-foreground mb-1">発注ID</p>
                <p className="text-xl font-bold font-mono text-green-700">{poId}</p>
              </div>
            )}
            
            <div className="space-y-3 w-full max-w-md">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-green-600" />
                <span>Suproleへメール送信済み</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Package className="h-4 w-4 text-green-600" />
                <span>発注ステータス: Suprole依頼中</span>
              </div>
            </div>
            
            <div className="pt-4 border-t w-full">
              <p className="text-sm text-muted-foreground">
                {countdown}秒後に発注一覧ページに移動します
              </p>
              <div className="mt-4 flex gap-2 justify-center">
                <Button onClick={() => onSuccess()} size="lg">
                  今すぐ発注一覧へ移動
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <>
      {/* 送信中のオーバーレイ */}
      {creating && (
        <Card className="border-blue-200 bg-blue-50/50 mb-6">
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-blue-900">
                  {sendingStage === 'creating' && '発注データを作成中...'}
                  {sendingStage === 'sending' && '依頼メールを送信中...'}
                  {sendingStage === 'complete' && '処理を完了しています...'}
                </h3>
                <p className="text-sm text-blue-700">
                  {sendingStage === 'creating' && '発注情報を準備しています'}
                  {sendingStage === 'sending' && 'Suproleへメールを送信しています'}
                  {sendingStage === 'complete' && 'まもなく完了します'}
                </p>
              </div>
              
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className={`h-2 w-2 rounded-full ${sendingStage === 'creating' ? 'bg-blue-600 animate-pulse' : 'bg-green-600'}`} />
                  <span>作成</span>
                </div>
                <div className="h-px w-8 bg-border" />
                <div className="flex items-center gap-1">
                  <div className={`h-2 w-2 rounded-full ${sendingStage === 'sending' ? 'bg-blue-600 animate-pulse' : sendingStage === 'complete' ? 'bg-green-600' : 'bg-gray-300'}`} />
                  <span>送信</span>
                </div>
                <div className="h-px w-8 bg-border" />
                <div className="flex items-center gap-1">
                  <div className={`h-2 w-2 rounded-full ${sendingStage === 'complete' ? 'bg-blue-600 animate-pulse' : 'bg-gray-300'}`} />
                  <span>完了</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card className={creating ? 'opacity-50 pointer-events-none' : ''}>
        <CardHeader>
          <CardTitle>発注内容の確認</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 商品情報 */}
          <div>
            <h4 className="font-semibold mb-3">商品情報</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
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
              {product.hazard && (
                <div className="col-span-2">
                  <Badge variant="destructive">危険物</Badge>
                </div>
              )}
              {product.hasExpiry && (
                <div className="col-span-2">
                  <Badge variant="outline">消費期限管理が必要</Badge>
                </div>
              )}
            </div>
          </div>
          
          <div className="border-t pt-6">
            <h4 className="font-semibold mb-3">発注数量</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">セット個数:</span>
                <p>{product.setSize}個/セット</p>
              </div>
              <div>
                <span className="text-muted-foreground">発注セット数:</span>
                <p className="font-medium">{orderData.setCount}セット</p>
              </div>
              <div>
                <span className="text-muted-foreground">発注数量（合計）:</span>
                <p className="font-medium text-lg">{quantity}個</p>
              </div>
            </div>
          </div>
          
          <div className="border-t pt-6">
            <h4 className="font-semibold mb-3">金額</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">単価（税抜/個）:</span>
                <span>¥{product.unitPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">税抜純売上高:</span>
                <span className="font-medium">¥{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  消費税（{(orderData.taxRate * 100).toFixed(0)}%）:
                </span>
                <span>¥{Math.round(tax).toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="font-semibold">税込合計:</span>
                <span className="font-bold text-xl">
                  ¥{Math.round(total).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          
          {orderData.remarks && (
            <div className="border-t pt-6">
              <h4 className="font-semibold mb-3">備考</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {orderData.remarks}
              </p>
            </div>
          )}
          
          <div className="border-t pt-6">
            <h4 className="font-semibold mb-3">初期ステータス</h4>
            <Badge className="bg-blue-100 text-blue-800">Suprole依頼中</Badge>
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      {/* ボタン */}
      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack} disabled={creating}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          戻る
        </Button>
        <Button 
          onClick={handleCreate} 
          disabled={creating} 
          className="flex-1"
          size="lg"
        >
          {creating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {sendingStage === 'creating' && '作成中...'}
              {sendingStage === 'sending' && 'メール送信中...'}
              {sendingStage === 'complete' && '完了処理中...'}
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-5 w-5" />
              発注を作成してメール送信
            </>
          )}
        </Button>
      </div>
    </>
  )
}

