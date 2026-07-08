-- ====================================================
-- 追加マイグレーション: 一言コメント・市区町村
-- Supabase の SQL Editor で実行してください
-- ====================================================

alter table gourmet_spots
  add column if not exists comment text,
  add column if not exists sub_area text;
