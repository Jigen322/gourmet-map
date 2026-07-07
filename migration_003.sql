-- ====================================================
-- 追加マイグレーション: 地図表示用の緯度・経度
-- Supabase の SQL Editor で実行してください(既存データは保持されます)
-- ====================================================

alter table gourmet_spots
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;
