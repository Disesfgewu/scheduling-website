import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ token: string }>;
}

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: 'tripsync' } },
  );
}

// POST — 用 token 加入行程（body: { userId }）
export async function POST(request: Request, context: RouteContext) {
  try {
    const { token } = await context.params;
    const { userId } = await request.json();

    if (!userId) return NextResponse.json({ error: '未登入' }, { status: 401 });

    const db = getDb();

    // 驗證 token 有效且未過期
    const { data: invite, error: inviteErr } = await db
      .from('trip_invites')
      .select('trip_id, role, expires_at')
      .eq('token', token)
      .single();

    if (inviteErr || !invite) {
      return NextResponse.json({ error: '邀請連結無效或已過期' }, { status: 404 });
    }
    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: '邀請連結已過期' }, { status: 410 });
    }

    // 確保 profile 存在
    await db.from('profiles').upsert(
      { id: userId, name: 'User', initials: 'U', color: '#6366f1' },
      { onConflict: 'id', ignoreDuplicates: true },
    );

    // 加入行程（已是成員則跳過）
    await db.from('trip_members').upsert(
      { trip_id: invite.trip_id, user_id: userId, role: invite.role },
      { onConflict: 'trip_id,user_id', ignoreDuplicates: true },
    );

    return NextResponse.json({ data: { tripId: invite.trip_id } });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to join' },
      { status: 500 },
    );
  }
}
