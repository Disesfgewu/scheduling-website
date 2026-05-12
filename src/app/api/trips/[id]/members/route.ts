import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ id: string }>;
}

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: 'tripsync' } },
  );
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id: tripId } = await context.params;
    const { email, role = 'editor' } = await request.json();

    if (!email) {
      return NextResponse.json({ error: '請輸入 Email' }, { status: 400 });
    }

    const db = getDb();

    // 呼叫 RPC function（在 auth schema 查找 email，跨 schema 操作）
    const { data, error } = await db.rpc('invite_member_by_email', {
      p_trip_id: tripId,
      p_email: email.toLowerCase().trim(),
      p_role: role,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const result = data as { error?: string; success?: boolean; user_id?: string };
    if (result?.error) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    // 回傳最新的 trip snapshot（含更新後的成員列表）
    const { data: trip } = await db
      .from('trips')
      .select('*, trip_members(id, role, joined_at, profiles(*))')
      .eq('id', tripId)
      .single();

    return NextResponse.json({ data: { trip } }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to invite member' },
      { status: 500 },
    );
  }
}
