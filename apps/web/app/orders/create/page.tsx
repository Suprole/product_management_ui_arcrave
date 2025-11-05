import { Suspense } from 'react'
import { DashboardHeader } from '@/components/dashboard-header'
import { OrderCreateView } from '@/components/order-create-view'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: '新規発注作成 | 商品管理システム',
  description: '新しい発注を作成',
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
          
          <h1 className="text-3xl font-bold tracking-tight">新規発注作成</h1>
          <p className="text-muted-foreground mt-1">
            商品を検索して発注を作成します
          </p>
        </div>

        <Suspense fallback={<div>読み込み中...</div>}>
          <OrderCreateView />
        </Suspense>
      </main>
    </div>
  )
}

