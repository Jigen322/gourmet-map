'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function deleteSpot(spotId) {
  const supabase = createClient()
  // RLSが「editor/admin、または自分の投稿のpost」のみ許可するので安全
  await supabase.from('gourmet_spots').delete().eq('id', spotId)
  revalidatePath('/')
  redirect('/')
}
