import { Suspense } from 'react'
import { DashboardHeader } from '@/components/dashboard-header'
import { OrderCreateView } from '@/components/order-create-view'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: '発注作成 | 商品管理システム',
  description: '発注カートへの互換導線',
}

export default function OrderCreatePage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container mx-auto p-6">
        <div className="mb-6">
          <Link href="/orders">
            <Button variant="ghost" size="sm" className="mb-4">
              <ChevronLeft className="mr-2 h-4 w-4" />
              発注一覧に戻る
            </Button>
          </Link>
          
          <h1 className="text-3xl font-bold tracking-tight">発注作成</h1>
          <p className="text-muted-foreground mt-1">
            旧作成導線から発注カートへ案内します
          </p>
        </div>

        <Suspense fallback={<div>読み込み中...</div>}>
          <OrderCreateView />
        </Suspense>
      </main>
    </div>
  )
}

