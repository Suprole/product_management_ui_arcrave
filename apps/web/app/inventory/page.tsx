import { DashboardHeader } from "@/components/dashboard-header"
import { InventoryManagementView } from "@/components/inventory-management-view"

export default function InventoryPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">在庫管理</h1>
          <p className="text-muted-foreground mt-2">在庫状況とアラート管理</p>
        </div>

        <InventoryManagementView />
      </main>
    </div>
  )
}
