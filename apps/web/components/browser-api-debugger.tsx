"use client"

import { useEffect } from "react"

declare global {
  interface Window {
    __arcraveApiDebugInstalled?: boolean
  }
}

function describeInput(input: RequestInfo | URL) {
  if (typeof input === "string") return input
  if (input instanceof URL) return input.toString()
  return input.url
}

function logNavigationTiming() {
  const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined
  if (!nav) return

  console.info("[ARCRAVE][NAV]", {
    type: nav.type,
    ttfbMs: Math.round(nav.responseStart),
    domContentLoadedMs: Math.round(nav.domContentLoadedEventEnd),
    loadEventMs: Math.round(nav.loadEventEnd),
  })
}

export function BrowserApiDebugger() {
  useEffect(() => {
    if (window.__arcraveApiDebugInstalled) return
    window.__arcraveApiDebugInstalled = true

    logNavigationTiming()

    const originalFetch = window.fetch.bind(window)

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const urlString = describeInput(input)
      const method = init?.method || (typeof input !== "string" && !(input instanceof URL) ? input.method : "GET")
      const startedAt = performance.now()

      try {
        const response = await originalFetch(input, init)
        const durationMs = Math.round(performance.now() - startedAt)

        if (urlString.includes("/api/gas/")) {
          console.groupCollapsed(
            `[ARCRAVE][API] ${response.status} ${method.toUpperCase()} ${urlString} ${durationMs}ms`,
          )
          console.info("read", {
            endpoint: response.headers.get("x-arcrave-read-endpoint"),
            mode: response.headers.get("x-arcrave-read-mode"),
            source: response.headers.get("x-arcrave-read-source"),
            objectPath: response.headers.get("x-arcrave-read-object-path"),
            apiDurationMs: response.headers.get("x-arcrave-read-duration-ms"),
            browserDurationMs: durationMs,
          })
          console.groupEnd()
        }

        return response
      } catch (error) {
        const durationMs = Math.round(performance.now() - startedAt)
        if (urlString.includes("/api/gas/")) {
          console.error("[ARCRAVE][API][ERROR]", {
            url: urlString,
            method: method.toUpperCase(),
            browserDurationMs: durationMs,
            error,
          })
        }
        throw error
      }
    }

    return () => {
      window.fetch = originalFetch
      window.__arcraveApiDebugInstalled = false
    }
  }, [])

  return null
}
