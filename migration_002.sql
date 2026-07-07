-- ====================================================
-- 追加マイグレーション: ジャンル複数選択・季節・旬の時期・投稿種類
-- Supabase の SQL Editor で実行してください(既存データは保持されます)
-- ====================================================

-- 1. 複数選択用の列を追加(配列型)
alter table gourmet_spots
  add column if not exists categories text[] not null default '{}',
  add column if not exists seasons text[] not null default '{}',
  add column if not exists season_month int,        -- 1〜12(任意)
  add column if not exists season_decade text,       -- '上旬' / '中旬' / '下旬'(任意)
  add column if not exists season_date date,         -- ピンポイントの日付(任意)
  add column if not exists spot_type text;           -- 'ご当地グルメ' / 'ご当地チェーン' / 'ソウルフード'

-- 2. 既存の単一ジャンル(category列)があれば、新しいcategories配列に移行
update gourmet_spots
set categories = array[category]
where category is not null and category <> '' and categories = '{}';

-- 3. 古い単一ジャンル列は不要になるので削除
alter table gourmet_spots drop column if exists category;

-- 4. 月の値が1〜12の範囲であることを保証(任意の安全策)
alter table gourmet_spots
  add constraint season_month_range check (season_month is null or (season_month between 1 and 12));

-- 5. 上旬/中旬/下旬の値を制限(任意の安全策)
alter table gourmet_spots
  add constraint season_decade_values check (season_decade is null or season_decade in ('上旬', '中旬', '下旬'));

-- 6. 投稿の種類の値を制限(任意の安全策)
alter table gourmet_spots
  add constraint spot_type_values check (spot_type is null or spot_type in ('ご当地グルメ', 'ご当地チェーン', 'ソウルフード'));
