// Data parsing and aggregation functions

export interface DailySales {
  date: string
  orderCount: number
  totalSales: number
  totalProfit: number
  profitRate: number
}

export interface Product {
  sku: string
  productName: string // Added product name field
  orderCount: number
  salesQuantity: number
  totalSales: number
  totalProfit: number
  profitRate: number
  currentStock: number
  stockHealth?: string
}

export interface InventoryData {
  date: string
  inventoryCount: number
  inventoryValue: number
}

// Parse TSV data from the attachments
export async function getSalesData(): Promise<DailySales[]> {
  // In a real app, this would read from the TSV file
  // For now, returning mock data based on the provided data
  return [
    { date: "2025/10/01", orderCount: 21, totalSales: 65306, totalProfit: 6034, profitRate: 9.24 },
    { date: "2025/10/02", orderCount: 9, totalSales: 25452, totalProfit: 2080, profitRate: 8.17 },
    { date: "2025/10/03", orderCount: 12, totalSales: 22818, totalProfit: 2292, profitRate: 10.04 },
    { date: "2025/10/04", orderCount: 33, totalSales: 100974, totalProfit: 8817, profitRate: 8.73 },
    { date: "2025/10/05", orderCount: 25, totalSales: 54990, totalProfit: 2498, profitRate: 4.54 },
    { date: "2025/10/06", orderCount: 16, totalSales: 39773, totalProfit: 1920, profitRate: 4.83 },
    { date: "2025/10/07", orderCount: 32, totalSales: 80541, totalProfit: 3964, profitRate: 4.92 },
    { date: "2025/10/08", orderCount: 23, totalSales: 63720, totalProfit: 3006, profitRate: 4.72 },
    { date: "2025/10/09", orderCount: 10, totalSales: 29617, totalProfit: 3293, profitRate: 11.12 },
    { date: "2025/10/10", orderCount: 28, totalSales: 62943, totalProfit: 6224, profitRate: 9.89 },
    { date: "2025/10/11", orderCount: 21, totalSales: 47643, totalProfit: 5198, profitRate: 10.91 },
    { date: "2025/10/12", orderCount: 12, totalSales: 24083, totalProfit: 4839, profitRate: 20.09 },
    { date: "2025/10/13", orderCount: 11, totalSales: 19423, totalProfit: 2400, profitRate: 12.36 },
    { date: "2025/10/14", orderCount: 6, totalSales: 14871, totalProfit: 3939, profitRate: 26.49 },
    { date: "2025/10/15", orderCount: 19, totalSales: 59453, totalProfit: 5207, profitRate: 8.76 },
    { date: "2025/10/16", orderCount: 34, totalSales: 88417, totalProfit: 9912, profitRate: 11.29 },
    { date: "2025/10/17", orderCount: 24, totalSales: 57554, totalProfit: 6174, profitRate: 10.73 },
    { date: "2025/10/18", orderCount: 30, totalSales: 66388, totalProfit: 3609, profitRate: 5.44 },
    { date: "2025/10/19", orderCount: 22, totalSales: 44410, totalProfit: 4406, profitRate: 9.92 },
  ]
}

export async function getProductsData(): Promise<Product[]> {
  // Mock data based on 商品別売上集計
  return [
    {
      sku: "6N-FGDZ-1ZSS",
      productName: "プレミアムワイヤレスイヤホン", // Added product names
      orderCount: 27,
      salesQuantity: 27,
      totalSales: 51786,
      totalProfit: 38777,
      profitRate: 74.88,
      currentStock: 21,
      stockHealth: undefined,
    },
    {
      sku: "EM-83I1-TZQM",
      productName: "スマートウォッチ Pro",
      orderCount: 42,
      salesQuantity: 48,
      totalSales: 87991,
      totalProfit: 15598,
      profitRate: 17.73,
      currentStock: 0,
      stockHealth: "out_of_stock",
    },
    {
      sku: "A7-YME1-CT7L",
      productName: "ポータブル充電器 20000mAh",
      orderCount: 61,
      salesQuantity: 65,
      totalSales: 134965,
      totalProfit: 10118,
      profitRate: 7.5,
      currentStock: 77,
      stockHealth: undefined,
    },
    {
      sku: "R3-HNLE-H9K2",
      productName: "Bluetoothスピーカー",
      orderCount: 32,
      salesQuantity: 32,
      totalSales: 53107,
      totalProfit: 9533,
      profitRate: 18.09,
      currentStock: 138,
      stockHealth: undefined,
    },
    {
      sku: "C3-CM8M-V0G3",
      productName: "USB-C ハブ 7in1",
      orderCount: 67,
      salesQuantity: 72,
      totalSales: 144432,
      totalProfit: 5687,
      profitRate: 3.94,
      currentStock: 82,
      stockHealth: undefined,
    },
    {
      sku: "WW-IG7F-CGG8",
      productName: "ノイズキャンセリングヘッドホン",
      orderCount: 23,
      salesQuantity: 25,
      totalSales: 111792,
      totalProfit: 4482,
      profitRate: 4.01,
      currentStock: 0,
      stockHealth: "out_of_stock",
    },
    {
      sku: "IG-7R9N-WKWK",
      productName: "4K Webカメラ",
      orderCount: 27,
      salesQuantity: 41,
      totalSales: 110590,
      totalProfit: 4151,
      profitRate: 3.75,
      currentStock: 35,
      stockHealth: undefined,
    },
    {
      sku: "0R-X703-9392",
      productName: "ワイヤレスマウス",
      orderCount: 34,
      salesQuantity: 34,
      totalSales: 54960,
      totalProfit: 6693,
      profitRate: 12.18,
      currentStock: 74,
      stockHealth: undefined,
    },
    {
      sku: "IZ-ZO9F-ARKP",
      productName: "メカニカルキーボード RGB",
      orderCount: 23,
      salesQuantity: 23,
      totalSales: 68302,
      totalProfit: 2381,
      profitRate: 3.49,
      currentStock: 13,
      stockHealth: undefined,
    },
    {
      sku: "6Q-EQX4-HZ2P",
      productName: "スマホスタンド 折りたたみ式",
      orderCount: 12,
      salesQuantity: 13,
      totalSales: 31986,
      totalProfit: 3814,
      profitRate: 11.92,
      currentStock: 7,
      stockHealth: undefined,
    },
    {
      sku: "LW-RM3U-ABJX",
      productName: "ゲーミングマウスパッド XXL",
      orderCount: 18,
      salesQuantity: 32,
      totalSales: 86554,
      totalProfit: 3304,
      profitRate: 3.82,
      currentStock: 70,
      stockHealth: undefined,
    },
    {
      sku: "QI-WCJM-NKIM",
      productName: "ワイヤレス充電器 15W",
      orderCount: 14,
      salesQuantity: 14,
      totalSales: 34738,
      totalProfit: 4612,
      profitRate: 13.28,
      currentStock: 19,
      stockHealth: undefined,
    },
    {
      sku: "UU-S0S2-9AE6",
      productName: "HDMIケーブル 2m",
      orderCount: 16,
      salesQuantity: 20,
      totalSales: 29325,
      totalProfit: 2318,
      profitRate: 7.9,
      currentStock: 72,
      stockHealth: undefined,
    },
    {
      sku: "WY-8Q7N-JI34",
      productName: "モニターアーム デュアル",
      orderCount: 13,
      salesQuantity: 18,
      totalSales: 55075,
      totalProfit: 1996,
      profitRate: 3.62,
      currentStock: 0,
      stockHealth: "out_of_stock",
    },
    {
      sku: "RQ-WM6W-R6I2",
      productName: "PCスタンド ノートパソコン用",
      orderCount: 35,
      salesQuantity: 36,
      totalSales: 59458,
      totalProfit: -257,
      profitRate: -0.43,
      currentStock: 7,
      stockHealth: "不足",
    },
    {
      sku: "3H-IPEG-E0IK",
      productName: "外付けSSD 1TB",
      orderCount: 62,
      salesQuantity: 79,
      totalSales: 135135,
      totalProfit: -6218,
      profitRate: -4.6,
      currentStock: 21,
      stockHealth: undefined,
    },
    {
      sku: "VV-8L7B-H8M6",
      productName: "スマホケース 耐衝撃",
      orderCount: 25,
      salesQuantity: 27,
      totalSales: 30264,
      totalProfit: -1124,
      profitRate: -3.72,
      currentStock: 33,
      stockHealth: undefined,
    },
    {
      sku: "20250725-278-11",
      productName: "液晶保護フィルム",
      orderCount: 5,
      salesQuantity: 6,
      totalSales: 2723,
      totalProfit: -1417,
      profitRate: -52.04,
      currentStock: 5,
      stockHealth: undefined,
    },
  ]
}

export async function getInventoryData(): Promise<InventoryData[]> {
  // Mock data based on 全体在庫日次集計
  return [
    { date: "2025/09/20", inventoryCount: 2042, inventoryValue: 2927233 },
    { date: "2025/09/21", inventoryCount: 2044, inventoryValue: 2927233 },
    { date: "2025/09/22", inventoryCount: 2032, inventoryValue: 2911102 },
    { date: "2025/09/23", inventoryCount: 2030, inventoryValue: 2900582 },
    { date: "2025/09/24", inventoryCount: 2026, inventoryValue: 2899568 },
    { date: "2025/09/25", inventoryCount: 2028, inventoryValue: 2898174 },
    { date: "2025/09/26", inventoryCount: 2025, inventoryValue: 2889285 },
    { date: "2025/09/27", inventoryCount: 2031, inventoryValue: 2905791 },
    { date: "2025/09/28", inventoryCount: 2033, inventoryValue: 2913043 },
    { date: "2025/09/29", inventoryCount: 2010, inventoryValue: 2880408 },
    { date: "2025/09/30", inventoryCount: 2012, inventoryValue: 2880666 },
    { date: "2025/10/01", inventoryCount: 2018, inventoryValue: 2885329 },
    { date: "2025/10/02", inventoryCount: 2009, inventoryValue: 2870141 },
    { date: "2025/10/03", inventoryCount: 2001, inventoryValue: 2860551 },
    { date: "2025/10/04", inventoryCount: 2084, inventoryValue: 2946796 },
    { date: "2025/10/05", inventoryCount: 2195, inventoryValue: 3094645 },
    { date: "2025/10/06", inventoryCount: 2246, inventoryValue: 3193990 },
    { date: "2025/10/07", inventoryCount: 2255, inventoryValue: 3208392 },
    { date: "2025/10/08", inventoryCount: 2278, inventoryValue: 3236166 },
    { date: "2025/10/09", inventoryCount: 2330, inventoryValue: 3289320 },
    { date: "2025/10/10", inventoryCount: 2769, inventoryValue: 4091175 },
    { date: "2025/10/11", inventoryCount: 2804, inventoryValue: 4162696 },
    { date: "2025/10/12", inventoryCount: 2815, inventoryValue: 4175905 },
    { date: "2025/10/13", inventoryCount: 2810, inventoryValue: 4169547 },
    { date: "2025/10/14", inventoryCount: 2817, inventoryValue: 4178168 },
  ]
}

export interface ProductDetail extends Product {
  asin: string
  category: string
  price: number
  cost: number
  averageRating: number
  reviewCount: number
}

export interface DailyProductSales {
  date: string
  salesQuantity: number
  totalSales: number
  totalProfit: number
  orderCount: number
}

export interface CartWinRate {
  date: string
  cartWinRate: number
  sessions: number
}

export async function getProductDetail(sku: string): Promise<ProductDetail | null> {
  const products = await getProductsData()
  const product = products.find((p) => p.sku === sku)

  if (!product) return null

  return {
    ...product,
    asin: `B0${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    category: "エレクトロニクス",
    price: Math.round(product.totalSales / product.salesQuantity),
    cost: Math.round((product.totalSales - product.totalProfit) / product.salesQuantity),
    averageRating: 4.2 + Math.random() * 0.7,
    reviewCount: Math.floor(Math.random() * 500) + 50,
  }
}

export async function getProductDailySales(sku: string): Promise<DailyProductSales[]> {
  // Mock daily sales data for a specific product
  const dates = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(2025, 8, 20 + i)
    return date.toISOString().split("T")[0].replace(/-/g, "/")
  })

  return dates.map((date) => ({
    date,
    salesQuantity: Math.floor(Math.random() * 5) + 1,
    totalSales: Math.floor(Math.random() * 10000) + 2000,
    totalProfit: Math.floor(Math.random() * 2000) + 200,
    orderCount: Math.floor(Math.random() * 5) + 1,
  }))
}

export async function getProductInventoryHistory(sku: string): Promise<{ date: string; stock: number }[]> {
  const dates = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(2025, 8, 20 + i)
    return date.toISOString().split("T")[0].replace(/-/g, "/")
  })

  let currentStock = 100
  return dates.map((date) => {
    currentStock += Math.floor(Math.random() * 20) - 10
    currentStock = Math.max(0, currentStock)
    return { date, stock: currentStock }
  })
}

export async function getProductCartWinRate(sku: string): Promise<CartWinRate[]> {
  const dates = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(2025, 8, 20 + i)
    return date.toISOString().split("T")[0].replace(/-/g, "/")
  })

  return dates.map((date) => ({
    date,
    cartWinRate: 60 + Math.random() * 30,
    sessions: Math.floor(Math.random() * 200) + 50,
  }))
}

export interface SalesAnalytics {
  topProducts: Product[]
  profitRanking: Product[]
  lowProfitProducts: Product[]
}

export async function getSalesAnalytics(): Promise<SalesAnalytics> {
  const products = await getProductsData()

  return {
    topProducts: [...products].sort((a, b) => b.totalSales - a.totalSales).slice(0, 10),
    profitRanking: [...products].sort((a, b) => b.totalProfit - a.totalProfit).slice(0, 10),
    lowProfitProducts: [...products].filter((p) => p.profitRate < 5).sort((a, b) => a.profitRate - b.profitRate),
  }
}

export interface InventoryAlert {
  sku: string
  productName: string
  currentStock: number
  status: "out_of_stock" | "low_stock" | "overstock"
  recommendedOrder?: number
}

export async function getInventoryAlerts(): Promise<InventoryAlert[]> {
  const products = await getProductsData()

  return products
    .filter((p) => p.currentStock === 0 || p.currentStock < 20 || p.currentStock > 150)
    .map((p) => ({
      sku: p.sku,
      productName: p.productName,
      currentStock: p.currentStock,
      status: p.currentStock === 0 ? "out_of_stock" : p.currentStock < 20 ? "low_stock" : "overstock",
      recommendedOrder: p.currentStock < 20 ? Math.max(50 - p.currentStock, 0) : undefined,
    }))
}
