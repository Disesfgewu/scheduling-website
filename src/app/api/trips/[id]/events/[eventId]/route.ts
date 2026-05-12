import { NextResponse } from 'next/server';
import { deleteEvent, updateEvent } from '@/server/trips';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ id: string; eventId: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id, eventId } = await context.params;
    const body = await request.json();
    const snapshot = await updateEvent(id, eventId, body ?? {});

    return NextResponse.json({ data: snapshot });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update event';
    const status = message.includes('not found') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id, eventId } = await context.params;
    const snapshot = await deleteEvent(id, eventId);

    return NextResponse.json({ data: snapshot });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete event';
    const status = message.includes('not found') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
