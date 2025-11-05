import { Suspense } from 'react'
import { DashboardHeader } from '@/components/dashboard-header'
import { OrdersView } from '@/components/orders-view'

export const metadata = {
  title: '発注管理 | 商品管理システム',
  description: '発注一覧・ステータス管理・メール送信',
}

export default function OrdersPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">発注管理</h1>
            <p className="text-muted-foreground mt-1">
              発注の作成・更新・ステータス管理・メール送信
            </p>
          </div>
        </div>

        <Suspense fallback={<div>読み込み中...</div>}>
          <OrdersView />
        </Suspense>
      </main>
    </div>
  )
}

