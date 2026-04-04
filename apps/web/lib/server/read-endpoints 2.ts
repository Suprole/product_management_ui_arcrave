import { getCurrentMonthToDateTokyo } from '@/lib/date-range'

export type ReadSourceMode = 'gas' | 'hybrid' | 'gcs-json'

export type ReadEndpointKey =
  | 'dashboard'
  | 'products'
  | 'product'
  | 'alerts'
  | 'masters'
  | 'productsSearch'
  | 'productsSuggest'

export type SnapshotPreset = {
  name: string
  query: Record<string, string>
}

type SnapshotPresetFactory = (date?: Date) => SnapshotPreset[]

export type ReadEndpointDefinition = {
  key: ReadEndpointKey
  gasPath: string
  migrationOrder: number
  snapshotStrategy: 'range' | 'sku-range' | 'full-list' | 'derived-from-masters'
  description: string
  defaultExportPresets: SnapshotPresetFactory
}

function buildMonthToDatePreset(date = new Date()): SnapshotPreset {
  const cur = getCurrentMonthToDateTokyo(date)
  return {
    name: 'month-to-date',
    query: { from: cur.from, to: cur.to, grain: 'day' },
  }
}

const emptyPresets: SnapshotPresetFactory = () => []

export const readEndpointDefinitions: Record<ReadEndpointKey, ReadEndpointDefinition> = {
  dashboard: {
    key: 'dashboard',
    gasPath: 'dashboard',
    migrationOrder: 1,
    snapshotStrategy: 'range',
    description: 'ダッシュボード向け集計。現在のUIでは月初から当日までが主な利用。',
    defaultExportPresets: (date) => [buildMonthToDatePreset(date)],
  },
  products: {
    key: 'products',
    gasPath: 'products',
    migrationOrder: 2,
    snapshotStrategy: 'range',
    description: '商品一覧向け集計。月次表示と在庫画面の全期間表示を先に最適化しやすい。',
    defaultExportPresets: (date) => [
      buildMonthToDatePreset(date),
      {
        name: 'all-history',
        query: { from: '2000-01-01' },
      },
    ],
  },
  product: {
    key: 'product',
    gasPath: 'product',
    migrationOrder: 3,
    snapshotStrategy: 'sku-range',
    description: 'SKU別詳細。SKU数に比例してオブジェクト数が増えるため段階導入向き。',
    defaultExportPresets: () => [
      {
        name: 'default-window',
        query: {},
      },
    ],
  },
  alerts: {
    key: 'alerts',
    gasPath: 'alerts',
    migrationOrder: 4,
    snapshotStrategy: 'range',
    description: 'アラート一覧。月次スナップショットと相性がよい。',
    defaultExportPresets: (date) => [buildMonthToDatePreset(date)],
  },
  masters: {
    key: 'masters',
    gasPath: 'masterview',
    migrationOrder: 5,
    snapshotStrategy: 'full-list',
    description: '商品マスタと仕入れマスタの結合結果。検索系の元データとしても再利用できる。',
    defaultExportPresets: () => [
      {
        name: 'all',
        query: {},
      },
    ],
  },
  productsSearch: {
    key: 'productsSearch',
    gasPath: 'searchproducts',
    migrationOrder: 6,
    snapshotStrategy: 'derived-from-masters',
    description: '発注作成用の商品検索。マスタの全件JSONからサーバー側で絞り込み可能。',
    defaultExportPresets: emptyPresets,
  },
  productsSuggest: {
    key: 'productsSuggest',
    gasPath: 'products',
    migrationOrder: 7,
    snapshotStrategy: 'derived-from-masters',
    description: '商品サジェスト。マスタの全件JSONから高速に導出可能。',
    defaultExportPresets: emptyPresets,
  },
}

export function getReadSourceMode(): ReadSourceMode {
  const raw = (process.env.READ_API_SOURCE || 'gas').trim().toLowerCase()
  if (raw === 'hybrid' || raw === 'gcs-json') return raw
  return 'gas'
}
