export type Grain = 'day' | 'week' | 'month'

export type DateRangeQuery = {
  from?: string
  to?: string
  grain?: Grain
}

export type ApiError = { error: string; code?: string; _status?: number; hint?: string }

export type TimePoint = { date: string; value: number }

// Dashboard
export type DashboardKPI = {
  revenue: number
  profit: number
  profitRate: number
  orders: number
  orderCount?: number // 互換性のため残す
  shippedUnits?: number // 互換性のため残す
  aov?: number // 互換性のため残す
  buyboxRateWeighted?: number // 互換性のため残す
  stockTotal: number
  totalStock?: number // 互換性のため残す
  totalRecommendedOrderQty?: number
  totalDemandForecast?: number
  periodFrom?: string
  periodTo?: string
}

export type DashboardSeries = {
  revenue?: TimePoint[]
  profit?: TimePoint[]
  profitRate?: TimePoint[]
  units?: TimePoint[]
  orders?: TimePoint[]
  buyboxRate?: TimePoint[]
  stock?: TimePoint[]
  orders90d?: TimePoint[]
}

export type DashboardResponse = { kpi: DashboardKPI; series?: Partial<DashboardSeries> } | ApiError

// Products list
export type InventoryHealth = '良' | '注意' | '危険' | '不明' | string

export type ProductListItem = {
  sku: string
  name: string
  asin: string
  category: string
  units: number
  revenue: number
  buyboxRate: number
  stock: number
  avgDailyUnits?: number
  doh?: number
  recommendedOrderQty: number
  demandForecast: number
  inventoryHealth: InventoryHealth
}

export type ProductsResponse = { items: ProductListItem[] } | ApiError

// Product detail
export type ProductDetailKPI = {
  units: number
  revenue: number
  buyboxRateWeighted?: number
  stockEnd?: number
  doh?: number
  recommendedOrderQty: number
  demandForecast: number
}

export type ProductDetailSeries = {
  revenueDaily: TimePoint[]
  unitsDaily: TimePoint[]
  stockDaily: TimePoint[]
  buyboxRateDaily?: TimePoint[]
  demandForecastByGrain?: TimePoint[]
  recommendedOrderQtyByGrain?: TimePoint[]
}

export type ProductDetailResponse =
  | {
      sku: string
      name: string
      asin: string
      category: string
      rating?: string | null
      periodFrom?: string
      periodTo?: string
      kpis: ProductDetailKPI
      series: ProductDetailSeries
    }
  | ApiError

// Alerts
export type AlertSeverity = 'Critical' | 'Warning' | 'Info'
export type AlertType = 'Ordering' | 'Inventory' | 'Performance' | 'Sales' | 'State'

export type AlertItem = {
  sku: string
  name?: string
  type: AlertType
  severity: AlertSeverity
  metrics: {
    recommendedOrderQty?: number
    demandForecast?: number
    stockEnd?: number
    doh?: number
    buyboxDrop7dPt?: number
    zeroSalesStreakDays?: number
    inventoryHealth?: InventoryHealth
  }
  message?: string
  updatedAt?: string
}

export type AlertsResponse = { items: AlertItem[] } | ApiError

// Product charts
export type DailyProductSales = {
  date: string
  salesQuantity: number
  totalSales: number
  totalProfit: number
  orderCount: number
}

export type CartWinRate = {
  date: string
  cartWinRate: number // percent 0..100
  sessions?: number
}

// ============================================================
// 発注管理 Types (Phase 6で追加)
// ============================================================

// Order Status
export type OrderStatus =
  | 'sup_依頼中'
  | 'be_メーカー取寄中'
  | 'be_納品手続完了'
  | 'sup_受取完了'
  | 'sup_fba出荷完了'
  | '保留'
  | '返品'

// Order
export type Order = {
  po_id: string
  sku: string
  asin: string
  productCode: string
  productName: string
  brand: string
  orderDate: string // YYYY-MM-DD
  seller: string
  quantity: number // 個数
  setCount: number // セット数
  setSize: number // セット個数
  unitPrice: number // 税抜単価/個
  subtotal: number // 税抜純売上高
  taxRate: number // 消費税率（小数: 0.1 = 10%）
  invoiceNo: string
  arrivalDate: string | null // YYYY-MM-DD
  status: OrderStatus
  remarks: string
  createdBy: string
  createdAt: string // YYYY-MM-DD HH:MM:SS
  lastUpdatedBy: string
  lastUpdatedAt: string // YYYY-MM-DD HH:MM:SS
}

export type OrdersResponse = { items: Order[]; total: number } | ApiError

// Create Order Input
export type CreateOrderInput = {
  sku: string
  setCount: number
  taxRate?: number // デフォルト: 0.1
  seller?: string // デフォルト: 'Suprole'
  orderDate?: string // YYYY-MM-DD、未指定時は今日
  remarks?: string
  createdBy: string
}

// Update Order Input
export type UpdateOrderInput = {
  taxRate?: number
  invoiceNo?: string
  arrivalDate?: string // YYYY-MM-DD
  remarks?: string
  updatedBy: string
}

// Change Status Input
export type ChangeStatusInput = {
  newStatus: OrderStatus
  updatedBy: string
}

// Send Mail Input
export type SendMailInput = {
  type: 'request' | 'delivery'
  poIds: string[]
}

// Product Search Result (for order creation)
export type ProductSearchResult = {
  sku: string
  asin: string
  productCode: string
  name: string
  brand: string
  setSize: number // セット個数
  minLot: number // 最小ロット（セット単位）
  purchasePrice: number // 仕入れ値（税抜/セット）
  unitPrice: number // 単価（税抜/個）= purchasePrice / setSize
  hazard: boolean // 危険物フラグ
  hasExpiry: boolean // 消費期限要フラグ
}

export type ProductSearchResponse = { items: ProductSearchResult[]; total: number } | ApiError

// Master View (商品マスタ + 仕入れマスタ結合)
export type MasterItem = ProductSearchResult
export type MasterViewResponse = { items: MasterItem[]; total: number } | ApiError

// Order Filters (for list page)
export type OrderFilters = {
  po_id?: string
  statuses?: OrderStatus[]
  sku?: string
  asin?: string
  seller?: string
  productName?: string
  fromDate?: string // YYYY-MM-DD
  toDate?: string // YYYY-MM-DD
}

// Status Transitions (ステータス遷移定義)
export const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  'sup_依頼中': ['be_メーカー取寄中', '保留', '返品'],
  'be_メーカー取寄中': ['be_納品手続完了', '保留', '返品'],
  'be_納品手続完了': ['sup_受取完了', '保留', '返品'],
  'sup_受取完了': ['sup_fba出荷完了', '保留', '返品'],
  'sup_fba出荷完了': ['保留', '返品'],
  '保留': ['保留', '返品'],
  '返品': [],
}

// ステータス表示名
export const STATUS_LABELS: Record<OrderStatus, string> = {
  'sup_依頼中': 'Suprole依頼中',
  'be_メーカー取寄中': 'befree取寄中',
  'be_納品手続完了': 'befree納品完了',
  'sup_受取完了': 'Suprole受取完了',
  'sup_fba出荷完了': 'FBA出荷完了',
  '保留': '保留',
  '返品': '返品',
}

// ステータスバッジの色
export const STATUS_COLORS: Record<OrderStatus, string> = {
  'sup_依頼中': 'bg-blue-100 text-blue-800',
  'be_メーカー取寄中': 'bg-yellow-100 text-yellow-800',
  'be_納品手続完了': 'bg-green-100 text-green-800',
  'sup_受取完了': 'bg-purple-100 text-purple-800',
  'sup_fba出荷完了': 'bg-indigo-100 text-indigo-800',
  '保留': 'bg-gray-100 text-gray-800',
  '返品': 'bg-red-100 text-red-800',
}


