#!/usr/bin/env node

/**
 * 指定 URL の読取系 API をまとめて疎通確認する。
 * 使い方:
 *   BASE_URL=https://your-preview.vercel.app node scripts/smoke-read-apis.mjs
 */

function getEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is required`)
  }
  return value
}

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

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  })

  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(`${url} failed with ${res.status}: ${JSON.stringify(body)}`)
  }

  return body
}

function ensure(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

async function main() {
  const baseUrl = getEnv('BASE_URL').replace(/\/+$/, '')
  const cur = getCurrentMonthToDateTokyo()

  const dashboard = await fetchJson(`${baseUrl}/api/gas/dashboard?from=${cur.from}&to=${cur.to}`)
  ensure('kpi' in dashboard, 'dashboard response is missing kpi')

  const products = await fetchJson(`${baseUrl}/api/gas/products?from=${cur.from}&to=${cur.to}`)
  ensure(Array.isArray(products.items), 'products response is missing items')

  const alerts = await fetchJson(`${baseUrl}/api/gas/alerts?from=${cur.from}&to=${cur.to}`)
  ensure(Array.isArray(alerts.items), 'alerts response is missing items')

  const masters = await fetchJson(`${baseUrl}/api/gas/masters`)
  ensure(Array.isArray(masters.items), 'masters response is missing items')

  const sampleSku = products.items?.[0]?.sku
  if (sampleSku) {
    const product = await fetchJson(`${baseUrl}/api/gas/product/${encodeURIComponent(sampleSku)}`)
    ensure(product.sku === sampleSku, 'product detail response does not match requested sku')
  }

  const searchQuery = masters.items?.[0]?.sku || ''
  if (searchQuery) {
    const search = await fetchJson(`${baseUrl}/api/gas/products/search?sku=${encodeURIComponent(searchQuery)}`)
    ensure(Array.isArray(search.items), 'products/search response is missing items')
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        baseUrl,
        checkedAt: new Date().toISOString(),
        sampleSku: sampleSku || null,
        counts: {
          products: products.items.length,
          alerts: alerts.items.length,
          masters: masters.items.length,
        },
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
