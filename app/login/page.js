'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    setLoading(false)
    if (error) {
      setError('メールアドレスかパスワードが正しくありません')
      return
    }
    router.push('/')
    router.refresh()
  }

  return (
    <div className="container" style={{ maxWidth: 420, paddingTop: 60 }}>
      <h2 style={{ marginBottom: 24 }}>ログイン</h2>
      <form onSubmit={handleSubmit}>
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
          <label htmlFor="password">パスワード</label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'ログイン中…' : 'ログイン'}
        </button>
      </form>
      <p style={{ marginTop: 20, fontSize: '0.9rem' }}>
        アカウントをお持ちでない方は <Link href="/signup" style={{ color: 'var(--color-lantern-deep)', fontWeight: 600 }}>会員登録</Link>
      </p>
    </div>
  )
}
