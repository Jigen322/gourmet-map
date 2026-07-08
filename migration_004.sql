-- ====================================================
-- 追加マイグレーション: 料理マスターテーブル(階層化)
-- Supabase の SQL Editor で実行してください
-- ====================================================

-- 1. 料理マスターテーブル
create table dishes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,          -- 料理名(例: ホルモン天ぷら)
  description text,                   -- 料理の説明
  image_url text,                     -- 代表画像
  categories text[] not null default '{}',
  seasons text[] not null default '{}',
  season_month int,
  season_decade text,
  season_date date,
  spot_type text,
  created_by uuid references profiles(id) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. gourmet_spots に dish_id を追加(任意、リンクしない投稿もOK)
alter table gourmet_spots
  add column if not exists dish_id uuid references dishes(id) on delete set null;

-- 3. RLS
alter table dishes enable row level security;

create policy "料理は誰でも閲覧可能"
  on dishes for select using (true);

create policy "ランクに応じて料理を登録可能"
  on dishes for insert
  with check (exists (
    select 1 from profiles p
    where p.id = auth.uid()
      and p.role in ('poster', 'editor', 'admin')
  ));

create policy "ランクに応じて料理を編集可能"
  on dishes for update
  using (exists (
    select 1 from profiles p
    where p.id = auth.uid()
      and (p.role in ('editor', 'admin')
        or (p.role = 'poster' and dishes.created_by = auth.uid()))
  ));

create policy "ランクに応じて料理を削除可能"
  on dishes for delete
  using (exists (
    select 1 from profiles p
    where p.id = auth.uid()
      and (p.role in ('editor', 'admin')
        or (p.role = 'poster' and dishes.created_by = auth.uid()))
  ));
