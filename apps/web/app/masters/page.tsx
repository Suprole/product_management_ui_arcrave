import { Suspense } from 'react'
import { DashboardHeader } from '@/components/dashboard-header'
import { MastersView } from '@/components/masters-view'

export const metadata = {
  title: 'マスタ閲覧 | 商品管理システム',
  description: '商品マスタと仕入れマスタの統合ビュー',
}

export default function MastersPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">マスタ閲覧</h1>
          <p className="text-muted-foreground mt-1">
            商品マスタと仕入れマスタの統合ビュー
          </p>
        </div>

        <Suspense fallback={<div>読み込み中...</div>}>
          <MastersView />
        </Suspense>
      </main>
    </div>
  )
}

