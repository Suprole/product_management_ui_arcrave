import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import Link from "next/link"

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const error = searchParams.error

  let errorMessage = "認証中にエラーが発生しました。"
  let errorDetails = "もう一度お試しください。"

  if (error === "AccessDenied") {
    errorMessage = "アクセスが拒否されました"
    errorDetails = "お使いのアカウントには、このシステムへのアクセス権限がありません。管理者にお問い合わせください。"
  } else if (error === "Configuration") {
    errorMessage = "設定エラー"
    errorDetails = "システムの設定に問題があります。管理者にお問い合わせください。"
  } else if (error === "Verification") {
    errorMessage = "認証エラー"
    errorDetails = "認証トークンの検証に失敗しました。もう一度お試しください。"
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-3">
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            {errorMessage}
          </CardTitle>
          <CardDescription className="text-center">
            {errorDetails}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/auth/signin">ログインページに戻る</Link>
            </Button>
          </div>
          
          {error && (
            <div className="text-xs text-center text-muted-foreground mt-4">
              <p className="font-mono">エラーコード: {error}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

