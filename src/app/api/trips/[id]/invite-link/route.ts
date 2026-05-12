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

// GET — 取得或建立邀請 token
export async function GET(_req: Request, context: RouteContext) {
  try {
    const { id: tripId } = await context.params;
    const db = getDb();

    // 找現有的未過期邀請
    const { data: existing } = await db
      .from('trip_invites')
      .select('token, expires_at')
      .eq('trip_id', tripId)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existing) {
      return NextResponse.json({ data: { token: existing.token } });
    }

    // 建立新邀請 token
    const { data: invite, error } = await db
      .from('trip_invites')
      .insert({ trip_id: tripId })
      .select('token')
      .single();

    if (error) throw new Error(error.message);
    return NextResponse.json({ data: { token: invite.token } });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create invite' },
      { status: 500 },
    );
  }
}
