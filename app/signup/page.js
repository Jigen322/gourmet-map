'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    })

    setLoading(false)
    if (error) {
      setError('登録に失敗しました: ' + error.message)
      return
    }
    setDone(true)
  }

  if (done) {
    return (
      <div className="container" style={{ maxWidth: 420, paddingTop: 60 }}>
        <h2>確認メールを送りました</h2>
        <p style={{ marginTop: 16, lineHeight: 1.7 }}>
          メールに記載されたリンクをクリックして登録を完了してください。
          完了したら<Link href="/login" style={{ color: 'var(--color-lantern-deep)', fontWeight: 600 }}>ログイン画面</Link>からログインできます。
        </p>
      </div>
    )
  }

  return (
    <div className="container" style={{ maxWidth: 420, paddingTop: 60 }}>
      <h2 style={{ marginBottom: 24 }}>会員登録</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="displayName">表示名</label>
          <input
            id="displayName"
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="例: グルメ太郎"
          />
        </div>
        <div className="form-field">
          <label htmlFor="email">メールアドレス</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label htmlFor="password">パスワード(6文字以上)</label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
          {loading ? '登録中…' : '登録する'}
        </button>
      </form>
      <p style={{ marginTop: 20, fontSize: '0.9rem' }}>
        すでにアカウントをお持ちの方は <Link href="/login" style={{ color: 'var(--color-lantern-deep)', fontWeight: 600 }}>ログイン</Link>
      </p>
      <p style={{ marginTop: 8, fontSize: '0.8rem', color: 'var(--color-ink-soft)' }}>
        登録した時点では「閲覧のみ」ランクになります。投稿・編集したい場合は管理人にランク変更を依頼してください。
      </p>
    </div>
  )
}
