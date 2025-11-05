"use client"

import { useEffect, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"

export function LoadingBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // ルート変更時にローディングを開始
    setIsLoading(true)
    setProgress(20)

    // プログレスバーのアニメーション
    const timer1 = setTimeout(() => setProgress(40), 100)
    const timer2 = setTimeout(() => setProgress(60), 300)
    const timer3 = setTimeout(() => setProgress(80), 600)

    // ローディング完了
    const completeTimer = setTimeout(() => {
      setProgress(100)
      setTimeout(() => {
        setIsLoading(false)
        setProgress(0)
      }, 200)
    }, 1000)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      clearTimeout(completeTimer)
    }
  }, [pathname, searchParams])

  if (!isLoading) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 h-1 bg-blue-500 transition-all duration-300 ease-out z-50"
      style={{
        width: `${progress}%`,
        opacity: progress === 100 ? 0 : 1,
      }}
    />
  )
}

