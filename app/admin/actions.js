'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateRole(userId, newRole) {
  const supabase = createClient()
  // RLSが「実行者が管理人ランクかどうか」を再度チェックするので、
  // ここで権限チェックを書き忘れても安全に守られます
  await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
  revalidatePath('/admin')
}
