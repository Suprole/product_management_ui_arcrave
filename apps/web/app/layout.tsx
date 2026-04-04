import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Suspense } from 'react'
import { LoadingBar } from '@/components/loading-bar'
import { BrowserApiDebugger } from '@/components/browser-api-debugger'
import { SessionProvider } from '@/components/session-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'v0 App',
  description: 'Created with v0',
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body className={`font-sans antialiased`}>
        <SessionProvider>
          <Suspense fallback={null}>
            <LoadingBar />
          </Suspense>
          <BrowserApiDebugger />
          {children}
          <Analytics />
        </SessionProvider>
      </body>
    </html>
  )
}
