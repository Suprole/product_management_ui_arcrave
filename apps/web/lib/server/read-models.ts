import { Storage } from '@google-cloud/storage'
import type { MasterItem, ProductSearchResponse } from '@/lib/types'
import { fetchGasJson } from '@/lib/server/gas'
import { getReadSourceMode, type ReadEndpointKey } from '@/lib/server/read-endpoints'

type QueryValue = string | undefined
type QueryRecord = Record<string, QueryValue>
type SnapshotResult<T> = { data: T; objectPath: string } | null
type ReadResult<T> = { data: T; source: 'snapshot' | 'gas'; objectPath?: string }

const DEFAULT_PREFIX = 'read-models/v1'
let storageClient: Storage | null = null

function getSnapshotBaseUrl() {
  return process.env.GCS_JSON_BASE_URL?.trim() || ''
}

function getSnapshotBucket() {
  return process.env.GCS_JSON_BUCKET?.trim() || ''
}

function getStorageClient() {
  if (storageClient) return storageClient

  const projectId = process.env.GCS_PROJECT_ID?.trim()
  const rawCredentials = process.env.GCS_SERVICE_ACCOUNT_JSON?.trim()

  if (!rawCredentials) {
    storageClient = new Storage(projectId ? { projectId } : {})
    return storageClient
  }

  const credentials = JSON.parse(rawCredentials)
  storageClient = new Storage({
    projectId: projectId || credentials.project_id,
    credentials: {
      client_email: credentials.client_email,
      private_key: credentials.private_key,
    },
  })

  return storageClient
}

function getSnapshotPrefix() {
  return (process.env.GCS_JSON_PREFIX || DEFAULT_PREFIX).replace(/^\/+|\/+$/g, '')
}

function encodeSegment(value: string) {
  return encodeURIComponent(value)
}

function normalizeQueryPart(value: string | undefined) {
  return encodeURIComponent(value || 'default')
}

function buildRangeKey(query: QueryRecord) {
  return [
    `from-${normalizeQueryPart(query.from)}`,
    `to-${normalizeQueryPart(query.to)}`,
    `grain-${normalizeQueryPart(query.grain || 'day')}`,
  ].join('__')
}

function buildSnapshotObjectPath(endpoint: ReadEndpointKey, query: QueryRecord) {
  const prefix = getSnapshotPrefix()

  switch (endpoint) {
    case 'dashboard':
    case 'products':
    case 'alerts':
      return `${prefix}/${endpoint}/${buildRangeKey(query)}.json`
    case 'product':
      if (!query.sku) {
        throw new Error('sku is required to resolve product snapshot path')
      }
      return `${prefix}/product/${encodeSegment(query.sku)}/${buildRangeKey(query)}.json`
    case 'masters':
      return `${prefix}/masters/all.json`
    default:
      throw new Error(`Unsupported snapshot endpoint: ${endpoint}`)
  }
}

async function fetchSnapshotObject<T>(objectPath: string): Promise<SnapshotResult<T>> {
  const bucketName = getSnapshotBucket()
  if (bucketName) {
    const file = getStorageClient().bucket(bucketName).file(objectPath)
    const [exists] = await file.exists()
    if (!exists) return null

    const [buffer] = await file.download()
    return {
      data: JSON.parse(buffer.toString('utf8')) as T,
      objectPath,
    }
  }

  const baseUrl = getSnapshotBaseUrl()
  if (!baseUrl) return null

  const url = new URL(objectPath, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`)
  const res = await fetch(url.toString(), {
    next: { revalidate: 60 },
    headers: { Accept: 'application/json' },
  })

  if (res.status === 404) return null
  if (!res.ok) {
    throw new Error(`Snapshot fetch failed: ${res.status} ${res.statusText}`)
  }

  return {
    data: (await res.json()) as T,
    objectPath,
  }
}

function shouldUseSnapshotOnly() {
  return getReadSourceMode() === 'gcs-json'
}

function shouldTrySnapshot() {
  return getReadSourceMode() !== 'gas'
}

function hasUnsupportedQueryKeys(query: QueryRecord, supportedKeys: string[]) {
  const supported = new Set(supportedKeys)
  return Object.entries(query).some(([key, value]) => Boolean(value) && !supported.has(key))
}

export async function readRangeModel<T>(
  endpoint: Extract<ReadEndpointKey, 'dashboard' | 'products' | 'alerts'>,
  gasPath: string,
  query: QueryRecord,
): Promise<ReadResult<T>> {
  const canUseSnapshot = !hasUnsupportedQueryKeys(query, ['from', 'to', 'grain'])

  if (shouldUseSnapshotOnly() && !canUseSnapshot) {
    throw new Error(`Snapshot-only mode does not support dynamic query params for ${endpoint}`)
  }

  if (shouldTrySnapshot() && canUseSnapshot) {
    const snapshot = await fetchSnapshotObject<T>(buildSnapshotObjectPath(endpoint, query))
    if (snapshot) return { ...snapshot, source: 'snapshot' as const }
    if (shouldUseSnapshotOnly()) {
      throw new Error(`Snapshot is missing for ${endpoint}`)
    }
  }

  return {
    data: await fetchGasJson<T>(gasPath, query),
    source: 'gas' as const,
  }
}

export async function readProductModel<T>(sku: string, query: QueryRecord): Promise<ReadResult<T>> {
  const params = { ...query, sku }
  const canUseSnapshot = !hasUnsupportedQueryKeys(params, ['sku', 'from', 'to', 'grain'])

  if (shouldUseSnapshotOnly() && !canUseSnapshot) {
    throw new Error('Snapshot-only mode does not support dynamic query params for product')
  }

  if (shouldTrySnapshot() && canUseSnapshot) {
    const snapshot = await fetchSnapshotObject<T>(buildSnapshotObjectPath('product', params))
    if (snapshot) return { ...snapshot, source: 'snapshot' as const }
    if (shouldUseSnapshotOnly()) {
      throw new Error(`Snapshot is missing for product ${sku}`)
    }
  }

  return {
    data: await fetchGasJson<T>('product', params),
    source: 'gas' as const,
  }
}

export async function readMastersModel<T>(): Promise<ReadResult<T>> {
  if (shouldTrySnapshot()) {
    const snapshot = await fetchSnapshotObject<T>(buildSnapshotObjectPath('masters', {}))
    if (snapshot) return { ...snapshot, source: 'snapshot' as const }
    if (shouldUseSnapshotOnly()) {
      throw new Error('Snapshot is missing for masters')
    }
  }

  return {
    data: await fetchGasJson<T>('masterview'),
    source: 'gas' as const,
  }
}

type MasterFilters = {
  q?: string | null
  sku?: string | null
  asin?: string | null
  productCode?: string | null
  brand?: string | null
  limit?: number | null
}

function sortMastersByName(items: MasterItem[]) {
  return items.slice().sort((a, b) => a.name.localeCompare(b.name))
}

export function filterMasterItems(items: MasterItem[], filters: MasterFilters) {
  let result = sortMastersByName(items).filter((item) => {
    if (filters.sku && item.sku !== filters.sku) return false
    if (filters.asin && item.asin !== filters.asin) return false
    if (filters.productCode && item.productCode !== filters.productCode) return false
    if (filters.brand && item.brand !== filters.brand) return false

    if (filters.q) {
      const keyword = filters.q.toLowerCase()
      if (!item.name.toLowerCase().includes(keyword)) {
        return false
      }
    }

    return true
  })

  if (filters.limit && filters.limit > 0) {
    result = result.slice(0, filters.limit)
  }

  return result
}

export function buildProductSearchResponse(items: MasterItem[], filters: MasterFilters): ProductSearchResponse {
  const filtered = filterMasterItems(items, filters)
  return {
    items: filtered,
    total: filtered.length,
  }
}

export function buildProductSuggestResponse(
  items: MasterItem[],
  query: string,
  limit = 10,
): { items: Array<Pick<MasterItem, 'sku' | 'asin' | 'productCode' | 'name' | 'brand'>>; total: number } {
  const keyword = query.trim().toLowerCase()
  if (keyword.length < 2) {
    return { items: [], total: 0 }
  }

  const filtered = items
    .filter((item) =>
      [item.sku, item.asin, item.name, item.productCode].some((value) =>
        String(value || '').toLowerCase().includes(keyword),
      ),
    )
    .slice(0, Math.max(0, limit))
    .map((item) => ({
      sku: item.sku,
      asin: item.asin,
      productCode: item.productCode,
      name: item.name,
      brand: item.brand,
    }))

  return {
    items: filtered,
    total: filtered.length,
  }
}
