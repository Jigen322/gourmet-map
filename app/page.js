import { createClient } from '@/lib/supabase/server'
import ViewSwitcher from '@/components/ViewSwitcher'

export default async function HomePage() {
  const supabase = createClient()
  const { data: spots } = await supabase
    .from('gourmet_spots')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="container">
      <div style={{ padding: '40px 0 0' }}>
        <h1 style={{ fontSize: '1.8rem' }}>みんなのご当地グルメ手帖</h1>
        <p style={{ color: 'var(--color-ink-soft)', marginTop: 8 }}>
          全国各地のご当地グルメを、旅のスタンプのように集めています。
        </p>
      </div>

      <ViewSwitcher spots={spots || []} />
    </div>
  )
}
