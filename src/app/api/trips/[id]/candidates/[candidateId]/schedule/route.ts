import { NextResponse } from 'next/server';
import { scheduleCandidate } from '@/server/trips';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ id: string; candidateId: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id, candidateId } = await context.params;
    const body = await request.json();

    if (!body?.date || !body?.time) {
      return NextResponse.json(
        { error: 'Missing required scheduling fields' },
        { status: 400 },
      );
    }

    const snapshot = await scheduleCandidate(id, candidateId, {
      date: body.date,
      time: body.time,
      endTime: body.endTime ?? undefined,
    });

    return NextResponse.json({ data: snapshot });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to schedule candidate';
    const status = message.includes('not found') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
