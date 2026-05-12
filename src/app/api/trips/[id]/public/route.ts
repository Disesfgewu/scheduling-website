import { NextResponse } from 'next/server';
import { getPublicTripSnapshot } from '@/server/trips';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const token = new URL(request.url).searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Invite token is required' }, { status: 400 });
    }

    const snapshot = await getPublicTripSnapshot(id, token);
    if (!snapshot) {
      return NextResponse.json({ error: 'Invite link is invalid' }, { status: 404 });
    }

    return NextResponse.json({ data: snapshot });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch shared trip';
    const status = message === 'Invite link expired' ? 410 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
