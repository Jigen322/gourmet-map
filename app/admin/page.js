import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { updateRole } from '@/app/admin/actions'

const ROLE_OPTIONS = [
  { value: 'viewer', label: '閲覧のみ' },
  { value: 'poster', label: '投稿可' },
  { value: 'editor', label: '編集可' },
  { value: 'admin', label: '管理人' },
]

export default async function AdminPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: myProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (myProfile?.role !== 'admin') redirect('/')

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, role, created_at')
    .order('created_at', { ascending: true })

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
      <h2 style={{ marginBottom: 8 }}>ユーザーランク管理</h2>
      <p style={{ color: 'var(--color-ink-soft)', marginBottom: 24 }}>
        会員登録した人のランクを変更できます。変更は即時に反映されます。
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {profiles?.map((p) => (
          <div
            key={p.id}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 18px', background: 'white', border: '1px solid var(--color-paper-dim)', borderRadius: 6,
            }}
          >
            <div>
              <strong>{p.display_name}</strong>
              <span className={`role-badge role-${p.role}`} style={{ marginLeft: 10 }}>
                {ROLE_OPTIONS.find((r) => r.value === p.role)?.label}
              </span>
            </div>

            <form action={async (formData) => {
              'use server'
              await updateRole(p.id, formData.get('role'))
            }}>
              <select name="role" defaultValue={p.role} style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid var(--color-paper-dim)', marginRight: 8 }}>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              <button type="submit" className="btn btn-primary" style={{ padding: '6px 16px' }}>変更</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  )
}
