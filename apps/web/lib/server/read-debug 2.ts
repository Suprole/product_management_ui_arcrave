import { NextResponse } from 'next/server'
import { getReadSourceMode } from '@/lib/server/read-endpoints'

type ReadDebugInfo = {
  endpoint: string
  source?: 'snapshot' | 'gas'
  objectPath?: string
  startedAt: number
}

export function withReadDebugHeaders<T>(response: NextResponse<T>, info: ReadDebugInfo) {
  response.headers.set('x-arcrave-read-endpoint', info.endpoint)
  response.headers.set('x-arcrave-read-mode', getReadSourceMode())
  response.headers.set('x-arcrave-read-duration-ms', String(Date.now() - info.startedAt))

  if (info.source) {
    response.headers.set('x-arcrave-read-source', info.source)
  }

  if (info.objectPath) {
    response.headers.set('x-arcrave-read-object-path', info.objectPath)
  }

  return response
}
