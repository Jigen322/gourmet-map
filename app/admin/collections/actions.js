'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createCollection(formData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const filterCats = formData.get('filter_categories')
  const filterSeasons = formData.get('filter_seasons')

  const payload = {
    name: formData.get('name'),
    description: formData.get('description') || null,
    collection_type: formData.get('collection_type'),
    filter_area: formData.get('filter_area') || null,
    filter_categories: filterCats ? filterCats.split(',').map(s => s.trim()).filter(Boolean) : [],
    filter_seasons: filterSeasons ? filterSeasons.split(',').map(s => s.trim()).filter(Boolean) : [],
    filter_spot_type: formData.get('filter_spot_type') || null,
    filter_in_season_now: formData.get('filter_in_season_now') === 'on',
    display_order: Number(formData.get('display_order') || 0),
    created_by: user.id,
  }

  await supabase.from('collections').insert(payload)
  revalidatePath('/admin/collections')
  revalidatePath('/')
  redirect('/admin/collections')
}

export async function deleteCollection(id) {
  const supabase = createClient()
  await supabase.from('collections').delete().eq('id', id)
  revalidatePath('/admin/collections')
  revalidatePath('/')
}

export async function addDishToCollection(collectionId, dishId) {
  const supabase = createClient()
  await supabase.from('collection_dishes').upsert({ collection_id: collectionId, dish_id: dishId })
  revalidatePath(`/admin/collections/${collectionId}`)
}

export async function removeDishFromCollection(collectionId, dishId) {
  const supabase = createClient()
  await supabase.from('collection_dishes').delete()
    .eq('collection_id', collectionId).eq('dish_id', dishId)
  revalidatePath(`/admin/collections/${collectionId}`)
}
