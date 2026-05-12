import { NextResponse } from 'next/server';
import { deleteCandidate } from '@/server/trips';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ id: string; candidateId: string }>;
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id, candidateId } = await context.params;
    const snapshot = await deleteCandidate(id, candidateId);

    return NextResponse.json({ data: snapshot });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete candidate';
    const status = message.includes('not found') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
