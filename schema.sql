-- ====================================================
-- ご当地グルメまとめサイト DBスキーマ
-- Supabase の SQL Editor にこの内容を貼り付けて実行してください
-- ====================================================

-- 1. ユーザーランクの種類を定義
create type user_role as enum ('viewer', 'poster', 'editor', 'admin');

-- 2. プロフィールテーブル(Supabase Authのユーザーと連動)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text not null default '名無しさん',
  role user_role not null default 'viewer',
  created_at timestamptz not null default now()
);

-- 新規ユーザー登録時に自動でprofilesレコードを作成するトリガー
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', '名無しさん'));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. グルメ投稿テーブル
create table gourmet_spots (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  area text not null,              -- 地域(例: 北海道、博多 など)
  category text,                   -- ジャンル(例: ラーメン、海鮮 など)
  description text,
  shop_name text,
  address text,
  image_url text,                  -- Storageにアップロードした画像のURL
  created_by uuid references profiles(id) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Row Level Security(行レベルセキュリティ)を有効化
alter table profiles enable row level security;
alter table gourmet_spots enable row level security;

-- ====================================================
-- profiles のポリシー
-- ====================================================

-- 誰でも(ログインユーザーなら)全プロフィールの閲覧は可能
create policy "プロフィールは誰でも閲覧可能"
  on profiles for select
  using (true);

-- 自分のプロフィール(表示名のみ)は自分で更新可能
create policy "自分のプロフィールは更新可能"
  on profiles for update
  using (auth.uid() = id);

-- ランク変更は管理人のみ可能(自分のrole列を含む更新は別ポリシーで制御)
create policy "管理人は全員のランクを変更可能"
  on profiles for update
  using (
    exists (
      select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ====================================================
-- gourmet_spots のポリシー
-- ====================================================

-- 閲覧:ログインしていれば誰でも見れる(未ログインでも見れるようにするなら using(true)に変更)
create policy "投稿は誰でも閲覧可能"
  on gourmet_spots for select
  using (true);

-- 投稿:poster, editor, admin ランクのみ新規投稿可能
create policy "ランクに応じて投稿可能"
  on gourmet_spots for insert
  with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role in ('poster', 'editor', 'admin')
    )
  );

-- 編集:editor/adminは全件編集可、posterは自分の投稿のみ編集可
create policy "ランクに応じて編集可能"
  on gourmet_spots for update
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and (
          p.role in ('editor', 'admin')
          or (p.role = 'poster' and gourmet_spots.created_by = auth.uid())
        )
    )
  );

-- 削除:editor/adminは全件削除可、posterは自分の投稿のみ削除可
create policy "ランクに応じて削除可能"
  on gourmet_spots for delete
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and (
          p.role in ('editor', 'admin')
          or (p.role = 'poster' and gourmet_spots.created_by = auth.uid())
        )
    )
  );

-- ====================================================
-- 画像用Storageバケット作成とポリシー
-- ====================================================

insert into storage.buckets (id, name, public)
values ('gourmet-images', 'gourmet-images', true);

create policy "画像は誰でも閲覧可能"
  on storage.objects for select
  using (bucket_id = 'gourmet-images');

create policy "ランクに応じて画像アップロード可能"
  on storage.objects for insert
  with check (
    bucket_id = 'gourmet-images'
    and exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role in ('poster', 'editor', 'admin')
    )
  );

-- ====================================================
-- 最初の管理人を設定する方法(プロジェクト作成後、自分で会員登録した後に実行)
-- ====================================================
-- 1. まずWebアプリで自分のアカウントを会員登録する
-- 2. 以下のSQLの 'あなたのメールアドレス' を実際のメールアドレスに変更して実行する
--
-- update profiles set role = 'admin'
-- where id = (select id from auth.users where email = 'あなたのメールアドレス');
