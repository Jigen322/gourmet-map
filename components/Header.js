import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/auth/actions'

const ROLE_LABEL = {
  viewer: '閲覧のみ',
  poster: '投稿可',
  editor: '編集可',
  admin: '管理人',
}

export default async function Header() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('display_name, role')
      .eq('id', user.id)
      .single()
    profile = data
  }

  const canPost = profile && ['poster', 'editor', 'admin'].includes(profile.role)

  return (
    <header className="site-header">
      <div className="container">
        <Link href="/">
          <span className="site-title">
            ご当地グルメ手帖
            <small>みんなで集める旅の味スタンプ帖</small>
          </span>
        </Link>

        <nav className="nav-links">
          {canPost && (
            <>
              <Link href="/dishes/new" className="btn btn-ghost">料理を登録</Link>
              <Link href="/spots/new" className="btn btn-primary">お店を投稿</Link>
            </>
          )}

          {profile?.role === 'admin' && (
            <>
              <Link href="/admin/collections" className="btn btn-ghost">コレクション管理</Link>
              <Link href="/admin" className="btn btn-ghost">ランク管理</Link>
            </>
          )}

          {user ? (
            <>
              <span className={`role-badge role-${profile?.role || 'viewer'}`} style={{ color: 'var(--color-paper)', borderColor: 'var(--color-paper)' }}>
                {profile?.display_name || 'ゲスト'}・{ROLE_LABEL[profile?.role] || '閲覧のみ'}
              </span>
              <form action={signOut}>
                <button type="submit" className="btn btn-ghost">ログアウト</button>
              </form>
            </>
          ) : (
            <Link href="/login" className="btn btn-ghost">
              ログイン
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
