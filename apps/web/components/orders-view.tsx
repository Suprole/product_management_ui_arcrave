'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { OrdersTable } from '@/components/orders-table'
import { OrdersFilter } from '@/components/orders-filter'
import { Plus, Mail, Package, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import type { Order, OrderFilters } from '@/lib/types'

export function OrdersView() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<OrderFilters>({})
  
  // データ取得
  const fetchOrders = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams()
      
      if (filters.po_id) params.set('po_id', filters.po_id)
      if (filters.statuses && filters.statuses.length > 0) {
        params.set('statuses', filters.statuses.join(','))
      }
      if (filters.sku) params.set('sku', filters.sku)
      if (filters.asin) params.set('asin', filters.asin)
      if (filters.seller) params.set('seller', filters.seller)
      if (filters.productName) params.set('productName', filters.productName)
      if (filters.fromDate) params.set('fromDate', filters.fromDate)
      if (filters.toDate) params.set('toDate', filters.toDate)
      
      const url = `/api/gas/orders${params.toString() ? '?' + params.toString() : ''}`
      const res = await fetch(url)
      
      if (!res.ok) {
        throw new Error('発注一覧の取得に失敗しました')
      }
      
      const data = await res.json()
      
      if ('error' in data) {
        throw new Error(data.error)
      }
      
      setOrders(data.items || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchOrders()
  }, [filters])
  
  // KPI計算（返品を除外）
  const activeOrders = orders.filter(o => o.status !== '返品')
  const totalCount = activeOrders.length
  const totalQuantity = activeOrders.reduce((sum, o) => sum + o.quantity, 0)
  const totalAmount = activeOrders.reduce((sum, o) => sum + o.subtotal, 0)
  
  return (
    <div className="space-y-6">
      {/* KPIカード */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">発注件数</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount.toLocaleString()}件</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">合計発注数</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQuantity.toLocaleString()}個</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">合計金額（税抜）</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{totalAmount.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>
      
      {/* アクションバー */}
      <div className="flex items-center justify-between">
        <OrdersFilter filters={filters} onFiltersChange={setFilters} />
        
        <Link href="/orders/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            新規発注
          </Button>
        </Link>
      </div>
      
      {/* テーブル */}
      {loading ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">読み込み中...</p>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-64">
              <p className="text-red-500">{error}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <OrdersTable orders={orders} onRefresh={fetchOrders} />
      )}
    </div>
  )
}

