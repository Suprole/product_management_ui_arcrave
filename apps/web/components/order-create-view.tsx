'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProductSearchStep } from '@/components/product-search-step'
import { OrderDetailsStep } from '@/components/order-details-step'
import { OrderConfirmStep } from '@/components/order-confirm-step'
import type { ProductSearchResult } from '@/lib/types'
import { Loader2 } from 'lucide-react'

type Step = 'search' | 'details' | 'confirm'

export function OrderCreateView() {
  const searchParams = useSearchParams()
  const skuFromUrl = searchParams.get('sku')
  
  const [currentStep, setCurrentStep] = useState<Step>('search')
  const [selectedProduct, setSelectedProduct] = useState<ProductSearchResult | null>(null)
  const [orderData, setOrderData] = useState<{
    setCount: number
    taxRate: number
    remarks: string
  } | null>(null)
  const [isAutoLoading, setIsAutoLoading] = useState(false)
  
  // URLパラメータからSKUが指定されている場合は自動検索
  useEffect(() => {
    if (!skuFromUrl) return
    
    const autoLoadProduct = async () => {
      setIsAutoLoading(true)
      try {
        const params = new URLSearchParams({ sku: skuFromUrl })
        const res = await fetch(`/api/gas/products/search?${params.toString()}`)
        
        if (!res.ok) {
          throw new Error('商品検索に失敗しました')
        }
        
        const data = await res.json()
        
        if ('error' in data) {
          console.error('商品検索エラー:', data.error)
          return
        }
        
        if (data.items && data.items.length > 0) {
          // 最初の商品を自動選択
          const product = data.items[0]
          setSelectedProduct(product)
          setCurrentStep('details')
        }
      } catch (err) {
        console.error('商品の自動読み込みに失敗しました:', err)
      } finally {
        setIsAutoLoading(false)
      }
    }
    
    autoLoadProduct()
  }, [skuFromUrl])
  
  // ステップ1: 商品検索・選択
  const handleProductSelect = (product: ProductSearchResult) => {
    setSelectedProduct(product)
    setCurrentStep('details')
  }
  
  // ステップ2: 数量入力
  const handleDetailsComplete = (data: { setCount: number; taxRate: number; remarks: string }) => {
    setOrderData(data)
    setCurrentStep('confirm')
  }
  
  // ステップ3: 確認後、発注一覧へ
  const handleCreateSuccess = () => {
    // 発注作成成功後は発注一覧ページへリダイレクト
    window.location.href = '/orders'
  }
  
  // 戻る処理
  const handleBack = () => {
    if (currentStep === 'confirm') {
      setCurrentStep('details')
    } else if (currentStep === 'details') {
      setCurrentStep('search')
      setSelectedProduct(null)
    }
  }
  
  // 自動読み込み中の表示
  if (isAutoLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-lg font-medium">商品情報を読み込んでいます...</p>
              <p className="text-sm text-muted-foreground">SKU: {skuFromUrl}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ステップインジケーター */}
      <Card>
        <CardHeader>
          <CardTitle>作成ステップ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  currentStep === 'search'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                1
              </div>
              <span
                className={
                  currentStep === 'search' ? 'font-semibold' : 'text-muted-foreground'
                }
              >
                商品検索
              </span>
            </div>
            
            <div className="h-px flex-1 bg-border mx-4" />
            
            <div className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  currentStep === 'details'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                2
              </div>
              <span
                className={
                  currentStep === 'details' ? 'font-semibold' : 'text-muted-foreground'
                }
              >
                数量入力
              </span>
            </div>
            
            <div className="h-px flex-1 bg-border mx-4" />
            
            <div className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  currentStep === 'confirm'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                3
              </div>
              <span
                className={
                  currentStep === 'confirm' ? 'font-semibold' : 'text-muted-foreground'
                }
              >
                確認・作成
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* ステップコンテンツ */}
      {currentStep === 'search' && (
        <ProductSearchStep onSelect={handleProductSelect} />
      )}
      
      {currentStep === 'details' && selectedProduct && (
        <OrderDetailsStep
          product={selectedProduct}
          onComplete={handleDetailsComplete}
          onBack={handleBack}
        />
      )}
      
      {currentStep === 'confirm' && selectedProduct && orderData && (
        <OrderConfirmStep
          product={selectedProduct}
          orderData={orderData}
          onSuccess={handleCreateSuccess}
          onBack={handleBack}
        />
      )}
    </div>
  )
}

