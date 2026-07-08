-- ====================================================
-- 追加マイグレーション: コレクション(最上位階層)
-- Supabase の SQL Editor で実行してください
-- ====================================================

-- 1. コレクションテーブル
create table collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,                  -- コレクション名(例: 広島グルメ)
  description text,                    -- 説明文
  image_url text,                      -- サムネイル画像
  collection_type text not null default 'manual',
    -- 'manual': 管理人が料理を手動で選ぶ
    -- 'auto':   条件に合う料理が自動で集まる

  -- 自動型フィルター条件(nullの場合は条件なし=全件)
  filter_area text,                    -- 例: '広島県'
  filter_categories text[],            -- 例: ['海鮮','魚']
  filter_seasons text[],               -- 例: ['春','夏']
  filter_spot_type text,               -- 例: 'ご当地グルメ'
  filter_in_season_now boolean default false,
    -- trueにすると「今が旬」の料理だけ自動で集まる

  display_order int not null default 0, -- 表示順(数字が小さい方が上)
  created_by uuid references profiles(id) not null,
  created_at timestamptz not null default now()
);

-- 2. 手動型コレクションと料理を繋ぐ中間テーブル
create table collection_dishes (
  collection_id uuid references collections(id) on delete cascade,
  dish_id uuid references dishes(id) on delete cascade,
  display_order int not null default 0,
  primary key (collection_id, dish_id)
);

-- 3. RLS
alter table collections enable row level security;
alter table collection_dishes enable row level security;

-- 誰でも閲覧可能
create policy "コレクションは誰でも閲覧可能"
  on collections for select using (true);

create policy "コレクション中間テーブルは誰でも閲覧可能"
  on collection_dishes for select using (true);

-- 管理人のみ作成・編集・削除
create policy "管理人のみコレクションを作成可能"
  on collections for insert
  with check (exists (
    select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'
  ));

create policy "管理人のみコレクションを編集可能"
  on collections for update
  using (exists (
    select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'
  ));

create policy "管理人のみコレクションを削除可能"
  on collections for delete
  using (exists (
    select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'
  ));

create policy "管理人のみ中間テーブルを操作可能"
  on collection_dishes for all
  using (exists (
    select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'
  ));
