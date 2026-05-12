-- ============================================================
-- Migration 005: Invite member by email (RPC function)
-- ============================================================

-- 透過 email 邀請成員，跨 auth + tripsync schema 操作
create or replace function tripsync.invite_member_by_email(
  p_trip_id  uuid,
  p_email    text,
  p_role     text default 'editor'
)
returns jsonb
language plpgsql
security definer
set search_path = tripsync, auth, extensions
as $$
declare
  v_user_id uuid;
begin
  -- 在 auth.users 找 email
  select id into v_user_id
  from auth.users
  where lower(email) = lower(p_email)
  limit 1;

  if v_user_id is null then
    return jsonb_build_object('error', '找不到此 Email，請確認對方已完成註冊');
  end if;

  -- 確保 profile 存在（以防 trigger 未跑）
  insert into tripsync.profiles (id, name, initials, color)
  values (
    v_user_id,
    split_part(p_email, '@', 1),
    upper(left(split_part(p_email, '@', 1), 2)),
    '#6366f1'
  )
  on conflict (id) do nothing;

  -- 新增成員（已是成員則更新 role）
  insert into tripsync.trip_members (trip_id, user_id, role)
  values (p_trip_id, v_user_id, p_role)
  on conflict (trip_id, user_id) do update set role = excluded.role;

  return jsonb_build_object('success', true, 'user_id', v_user_id::text);
end;
$$;

-- 只讓 trip owner 和 editor 呼叫此 function（透過 API route 保護）
grant execute on function tripsync.invite_member_by_email to service_role;
