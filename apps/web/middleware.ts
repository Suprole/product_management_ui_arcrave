import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  
  // 公開パス（認証不要）
  const publicPaths = [
    "/auth/signin",
    "/auth/error",
    "/api/auth",
    "/api/gas",  // GAS APIプロキシ（内部使用、GAS_API_KEYで保護済み）
  ]
  
  // 公開パスの場合は認証チェックをスキップ
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }
  
  // 認証チェック
  if (!req.auth) {
    // API呼び出しの場合は401を返す（リダイレクトしない）
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // 未認証の場合、サインインページにリダイレクト
    const signInUrl = new URL("/api/auth/signin", req.url)
    signInUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(signInUrl)
  }
  
  // 認証済みの場合、次へ進む
  return NextResponse.next()
})

// ミドルウェアを適用するパスの設定
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}

