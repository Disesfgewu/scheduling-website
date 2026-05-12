import { NextResponse } from 'next/server';
import { getTripSnapshot } from '@/server/trips';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const snapshot = await getTripSnapshot(id);

  if (!snapshot) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }

  return NextResponse.json({ data: snapshot });
}
