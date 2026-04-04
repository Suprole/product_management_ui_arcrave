type JsonObject = Record<string, unknown>

export function getGasConfig() {
  const base = process.env.GAS_API_BASE
  const key = process.env.GAS_API_KEY

  if (!base || !key) {
    throw new Error('GAS API configuration is missing')
  }

  return { base, key }
}

export function buildGasUrl(path: string, params: Record<string, string | undefined> = {}) {
  const { base, key } = getGasConfig()
  const url = new URL(base)
  url.searchParams.set('key', key)
  url.searchParams.set('path', path)

  Object.entries(params).forEach(([name, value]) => {
    if (value) {
      url.searchParams.set(name, value)
    }
  })

  return url
}

export async function fetchGasJson<T>(
  path: string,
  params: Record<string, string | undefined> = {},
  init?: RequestInit,
): Promise<T> {
  const url = buildGasUrl(path, params)
  const res = await fetch(url.toString(), {
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      ...(init?.headers || {}),
    },
    ...init,
  })

  const data = (await res.json()) as T
  if (!res.ok && data && typeof data === 'object' && !('_status' in (data as JsonObject))) {
    ;(data as JsonObject)._status = res.status
  }

  return data
}

export function getResponseStatus(data: unknown, fallbackStatus = 200) {
  if (data && typeof data === 'object' && '_status' in (data as JsonObject)) {
    const status = Number((data as JsonObject)._status)
    if (status >= 400) return status
  }

  return fallbackStatus
}
