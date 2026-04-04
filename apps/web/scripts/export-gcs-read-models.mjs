#!/usr/bin/env node

/**
 * 読取系のGASレスポンスを事前生成して GCS / ローカルディレクトリへ保存する。
 * Cloud Run / Cloud Functions / CI など Node.js が動く環境での定期実行を想定。
 */

import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { Storage } from '@google-cloud/storage'

const DEFAULT_PREFIX = 'read-models/v1'

function pad2(value) {
  return String(value).padStart(2, '0')
}

function getCurrentMonthToDateTokyo(date = new Date()) {
  const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000)
  const year = jst.getUTCFullYear()
  const month = jst.getUTCMonth() + 1
  const day = jst.getUTCDate()

  return {
    from: `${year}-${pad2(month)}-01`,
    to: `${year}-${pad2(month)}-${pad2(day)}`,
  }
}

function getEnv(name, options = {}) {
  const value = process.env[name]
  if (!value && options.required) {
    throw new Error(`${name} is required`)
  }
  return value
}

function getGasConfig() {
  return {
    base: getEnv('GAS_API_BASE', { required: true }),
    key: getEnv('GAS_API_KEY', { required: true }),
  }
}

function getStorageClient() {
  const projectId = process.env.GCS_PROJECT_ID
  const rawCredentials = process.env.GCS_SERVICE_ACCOUNT_JSON

  if (!rawCredentials) {
    return new Storage(projectId ? { projectId } : {})
  }

  const credentials = JSON.parse(rawCredentials)
  return new Storage({
    projectId: projectId || credentials.project_id,
    credentials: {
      client_email: credentials.client_email,
      private_key: credentials.private_key,
    },
  })
}

function normalizePart(value, fallback = 'default') {
  return encodeURIComponent(value || fallback)
}

function buildRangeKey(query = {}) {
  return [
    `from-${normalizePart(query.from)}`,
    `to-${normalizePart(query.to)}`,
    `grain-${normalizePart(query.grain || 'day')}`,
  ].join('__')
}

function buildObjectPath(prefix, endpoint, query = {}) {
  switch (endpoint) {
    case 'dashboard':
    case 'products':
    case 'alerts':
      return `${prefix}/${endpoint}/${buildRangeKey(query)}.json`
    case 'product':
      return `${prefix}/product/${encodeURIComponent(query.sku)}/${buildRangeKey(query)}.json`
    case 'masters':
      return `${prefix}/masters/all.json`
    default:
      throw new Error(`Unsupported endpoint: ${endpoint}`)
  }
}

function buildGasUrl(pathName, query = {}) {
  const { base, key } = getGasConfig()
  const url = new URL(base)
  url.searchParams.set('key', key)
  url.searchParams.set('path', pathName)

  for (const [name, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(name, String(value))
    }
  }

  return url.toString()
}

async function fetchGasJson(pathName, query = {}) {
  const res = await fetch(buildGasUrl(pathName, query), {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch ${pathName}: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()
  if (data && typeof data === 'object' && Number(data._status) >= 400) {
    throw new Error(`Upstream returned _status=${data._status} for ${pathName}`)
  }

  return data
}

async function ensureLocalWrite(baseDir, objectPath, payload) {
  if (!baseDir) return
  const fullPath = path.join(baseDir, objectPath)
  await mkdir(path.dirname(fullPath), { recursive: true })
  await writeFile(fullPath, JSON.stringify(payload, null, 2), 'utf8')
}

async function uploadJson(bucket, objectPath, payload) {
  await bucket.file(objectPath).save(JSON.stringify(payload), {
    contentType: 'application/json; charset=utf-8',
    resumable: false,
    metadata: {
      cacheControl: 'public, max-age=60, s-maxage=300',
    },
  })
}

async function exportSnapshot({ bucket, prefix, endpoint, query, payload, localDir, dryRun }) {
  const objectPath = buildObjectPath(prefix, endpoint, query)

  await ensureLocalWrite(localDir, objectPath, payload)

  if (!dryRun && bucket) {
    await uploadJson(bucket, objectPath, payload)
  }

  return {
    endpoint,
    objectPath,
    query,
    itemCount: Array.isArray(payload?.items) ? payload.items.length : undefined,
  }
}

async function runWithConcurrency(items, concurrency, worker) {
  const queue = items.slice()
  const runners = Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (queue.length > 0) {
      const item = queue.shift()
      if (item === undefined) return
      await worker(item)
    }
  })
  await Promise.all(runners)
}

async function main() {
  const prefix = (process.env.GCS_JSON_PREFIX || DEFAULT_PREFIX).replace(/^\/+|\/+$/g, '')
  const bucketName = process.env.GCS_JSON_BUCKET
  const localDir = process.env.GCS_JSON_LOCAL_DIR
  const dryRun = process.env.READ_MODEL_EXPORT_DRY_RUN === '1'
  const today = new Date()
  const monthToDate = getCurrentMonthToDateTokyo(today)
  const productLimit = Number(process.env.GCS_PRODUCT_EXPORT_LIMIT || '0')
  const productConcurrency = Number(process.env.GCS_PRODUCT_EXPORT_CONCURRENCY || '8')

  if (!bucketName && !localDir) {
    throw new Error('Set either GCS_JSON_BUCKET or GCS_JSON_LOCAL_DIR')
  }

  const storage = bucketName ? getStorageClient() : null
  const bucket = bucketName ? storage.bucket(bucketName) : null

  const manifest = {
    generatedAt: new Date().toISOString(),
    prefix,
    entries: [],
  }

  const dashboardMonth = await fetchGasJson('dashboard', monthToDate)
  manifest.entries.push(
    await exportSnapshot({
      bucket,
      prefix,
      endpoint: 'dashboard',
      query: monthToDate,
      payload: dashboardMonth,
      localDir,
      dryRun,
    }),
  )

  const productsMonth = await fetchGasJson('products', monthToDate)
  manifest.entries.push(
    await exportSnapshot({
      bucket,
      prefix,
      endpoint: 'products',
      query: monthToDate,
      payload: productsMonth,
      localDir,
      dryRun,
    }),
  )

  const productsAll = await fetchGasJson('products', { from: '2000-01-01' })
  manifest.entries.push(
    await exportSnapshot({
      bucket,
      prefix,
      endpoint: 'products',
      query: { from: '2000-01-01' },
      payload: productsAll,
      localDir,
      dryRun,
    }),
  )

  const alertsMonth = await fetchGasJson('alerts', monthToDate)
  manifest.entries.push(
    await exportSnapshot({
      bucket,
      prefix,
      endpoint: 'alerts',
      query: monthToDate,
      payload: alertsMonth,
      localDir,
      dryRun,
    }),
  )

  const mastersAll = await fetchGasJson('masterview')
  manifest.entries.push(
    await exportSnapshot({
      bucket,
      prefix,
      endpoint: 'masters',
      query: {},
      payload: mastersAll,
      localDir,
      dryRun,
    }),
  )

  const skus = Array.isArray(productsAll?.items)
    ? productsAll.items.map((item) => item.sku).filter(Boolean)
    : []

  const limitedSkus = productLimit > 0 ? skus.slice(0, productLimit) : skus

  let exportedProductCount = 0
  await runWithConcurrency(limitedSkus, productConcurrency, async (sku) => {
    const payload = await fetchGasJson('product', { sku })
    const entry = await exportSnapshot({
      bucket,
      prefix,
      endpoint: 'product',
      query: { sku },
      payload,
      localDir,
      dryRun,
    })
    manifest.entries.push(entry)
    exportedProductCount += 1
    if (exportedProductCount % 10 === 0 || exportedProductCount === limitedSkus.length) {
      console.log(`exported product snapshots: ${exportedProductCount}/${limitedSkus.length}`)
    }
  })

  const manifestObjectPath = `${prefix}/manifest.json`
  await ensureLocalWrite(localDir, manifestObjectPath, manifest)
  if (!dryRun && bucket) {
    await uploadJson(bucket, manifestObjectPath, manifest)
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        generatedAt: manifest.generatedAt,
        entryCount: manifest.entries.length,
        bucket: bucketName || null,
        localDir: localDir || null,
        dryRun,
      },
      null,
      2,
    ),
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
