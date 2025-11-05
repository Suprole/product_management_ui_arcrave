import NextAuth, { DefaultSession } from "next-auth"
import Google from "next-auth/providers/google"

// 型拡張
declare module "next-auth" {
  interface Session {
    user: {
      id: string
    } & DefaultSession["user"]
  }
}

// 許可されたメールアドレスのチェック
function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false
  
  const allowedEmails = process.env.ALLOWED_EMAILS || ""
  const allowedList = allowedEmails
    .split(",")
    .map(e => e.trim())
    .filter(e => e.length > 0)
  
  // 設定がない場合は全て許可（開発用）
  if (allowedList.length === 0) {
    console.warn("⚠️ ALLOWED_EMAILS is not configured. Allowing all authenticated users.")
    return true
  }
  
  return allowedList.includes(email)
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // メールアドレスがallowlistに含まれているかチェック
      if (!isAllowedEmail(user.email)) {
        console.log(`❌ Access denied for: ${user.email}`)
        return false // ログインを拒否
      }
      
      console.log(`✅ Access granted for: ${user.email}`)
      return true
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
  trustHost: true, // Vercel用
})

