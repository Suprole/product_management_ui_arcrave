import { Suspense } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { KPICards } from "@/components/kpi-cards"
import { SalesChart } from "@/components/sales-chart"
import { InventoryChart } from "@/components/inventory-chart"
import { TopProductsTable } from "@/components/top-products-table"
import { AlertsPanel } from "@/components/alerts-panel"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-6 space-y-6">
        <Suspense fallback={<div>Loading...</div>}>
          <KPICards />
        </Suspense>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Suspense fallback={<div>Loading...</div>}>
            <SalesChart />
          </Suspense>

          <Suspense fallback={<div>Loading...</div>}>
            <InventoryChart />
          </Suspense>
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <AlertsPanel />
        </Suspense>

        <Suspense fallback={<div>Loading...</div>}>
          <TopProductsTable />
        </Suspense>
      </main>
    </div>
  )
}
