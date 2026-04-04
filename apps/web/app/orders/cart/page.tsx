import { DashboardHeader } from '@/components/dashboard-header'
import { OrdersCartView } from '@/components/orders-cart-view'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: '発注カート | 商品管理システム',
  description: '複数商品をまとめて発注するカート画面',
}

export default function OrdersCartPage() {
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

          <h1 className="text-3xl font-bold tracking-tight">発注カート</h1>
          <p className="mt-1 text-muted-foreground">
            複数商品をカートに追加し、数量や備考を調整してまとめて発注します。
          </p>
        </div>

        <OrdersCartView />
      </main>
    </div>
  )
}
