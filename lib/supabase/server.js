import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// サーバーコンポーネント・サーバーアクションから使うSupabaseクライアント
// ログイン状態(cookie)をサーバー側でも認識するための仕組みです
export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component から呼ばれた場合は無視してよい
            // (middlewareがセッション更新を担当するため)
          }
        },
      },
    }
  )
}
