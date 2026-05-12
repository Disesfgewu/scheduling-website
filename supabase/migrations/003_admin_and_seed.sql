-- ============================================================
-- Migration 003: Admin Account & Auto-Profile Trigger
-- Schema: tripsync
-- ============================================================

-- ── 新使用者自動建立 profile ─────────────────────────────────
-- 當 Supabase Auth 新增 user 時，自動在 tripsync.profiles 建立對應資料

create or replace function tripsync.handle_new_user()
returns trigger language plpgsql security definer
set search_path = tripsync, auth, extensions
as $$
declare
  _name     text;
  _initials text;
  _colors   text[] := array[
    '#6366f1','#8b5cf6','#ec4899',
    '#10b981','#f59e0b','#3b82f6','#f43f5e'
  ];
  _color    text;
  _count    int;
begin
  -- 取得名稱（優先用 metadata 裡的 name，其次用 email 前綴）
  _name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'name'), ''),
    split_part(new.email, '@', 1)
  );

  -- 產生縮寫（最多 2 個字）
  _initials := upper(
    left(split_part(_name, ' ', 1), 1) ||
    coalesce(left(nullif(split_part(_name, ' ', 2), ''), 1), '')
  );

  -- 用現有 profile 數量挑顏色
  select count(*) into _count from tripsync.profiles;
  _color := _colors[1 + (_count % array_length(_colors, 1))];

  insert into tripsync.profiles (id, name, initials, color, role)
  values (
    new.id,
    _name,
    _initials,
    _color,
    -- ⬇ 把這裡的 email 換成你自己的，第一次 sign up 就自動成為 admin
    case when new.email = current_setting('app.admin_email', true)
         then 'admin'
         else 'user'
    end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- 綁定觸發器到 auth.users（需要 supabase_admin 權限，CLI push 或 Dashboard SQL Editor 才能執行）
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure tripsync.handle_new_user();


-- ── 設定 Admin Email ─────────────────────────────────────────
-- 方法 A：使用 Supabase 設定（推薦）
--   Dashboard → Settings → Database → Configuration → Custom config
--   新增：app.admin_email = your-email@example.com
--
-- 方法 B：直接改 migration 003 的 trigger 判斷：
--   把 current_setting('app.admin_email', true)
--   換成你的 email 字串，例如：'admin@tripsync.app'
--
-- 方法 C：建立帳號後手動升級（最安全）
--   update tripsync.profiles
--   set role = 'admin'
--   where id = (select id from auth.users where email = 'your@email.com');


-- ── Admin 可看所有 profiles ──────────────────────────────────
create policy "profiles_admin_select_all"
  on tripsync.profiles for select
  using (
    exists (
      select 1 from tripsync.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "profiles_admin_update_all"
  on tripsync.profiles for update
  using (
    exists (
      select 1 from tripsync.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );


-- ── 確認 admin 帳號（執行後查看）────────────────────────────
-- select p.id, p.name, p.role, u.email
-- from tripsync.profiles p
-- join auth.users u on u.id = p.id
-- where p.role = 'admin';
