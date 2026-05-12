import { NextResponse } from 'next/server';
import { createCandidate } from '@/server/trips';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    if (!body?.name || !body?.category) {
      return NextResponse.json(
        { error: 'Missing required candidate fields' },
        { status: 400 },
      );
    }

    const snapshot = await createCandidate(id, {
      name: body.name,
      address: body.address ?? undefined,
      phone: body.phone ?? undefined,
      website: body.website ?? undefined,
      openingHours: body.openingHours ?? undefined,
      priceLevel: body.priceLevel ?? undefined,
      priceNote: body.priceNote ?? undefined,
      reservationRequired: body.reservationRequired ?? undefined,
      category: body.category,
      notes: body.notes ?? undefined,
      location: body.location ?? undefined,
    });

    return NextResponse.json({ data: snapshot }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create candidate';
    const status = message.includes('not found') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
