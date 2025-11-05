import { DashboardHeader } from "@/components/dashboard-header"
import { ProductsTable } from "@/components/products-table"

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">商品管理</h1>
          <p className="text-muted-foreground mt-2">全商品の在庫状況、売上、利益を管理</p>
        </div>

        <ProductsTable />
      </main>
    </div>
  )
}
