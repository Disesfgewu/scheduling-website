import { NextResponse } from 'next/server';
import { createEvent } from '@/server/trips';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    if (!body?.title || !body?.date || !body?.time || !body?.category || !body?.color) {
      return NextResponse.json(
        { error: 'Missing required event fields' },
        { status: 400 },
      );
    }

    const snapshot = await createEvent(id, {
      title: body.title,
      date: body.date,
      time: body.time,
      endTime: body.endTime ?? undefined,
      location: body.location ?? undefined,
      category: body.category,
      notes: body.notes ?? undefined,
      color: body.color,
      phone: body.phone ?? undefined,
      website: body.website ?? undefined,
      openingHours: body.openingHours ?? undefined,
      priceNote: body.priceNote ?? undefined,
      reservationRequired: body.reservationRequired ?? undefined,
      bookingUrl: body.bookingUrl ?? undefined,
      duration: body.duration ?? undefined,
      fromCandidateId: body.fromCandidateId ?? undefined,
    });

    return NextResponse.json({ data: snapshot }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create event';
    const status = message.includes('not found') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
