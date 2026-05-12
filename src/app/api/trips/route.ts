import { NextResponse } from 'next/server';
import { createTrip, listTrips } from '@/server/trips';

export const runtime = 'nodejs';

export async function GET() {
  const trips = await listTrips();
  return NextResponse.json({ data: { trips } });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body?.title || !body?.startDate || !body?.endDate) {
      return NextResponse.json(
        { error: 'Missing required trip fields' },
        { status: 400 },
      );
    }

    const trip = await createTrip({
      title: body.title,
      description: body.description ?? '',
      location: body.location ?? '',
      country: body.country ?? '',
      startDate: body.startDate,
      endDate: body.endDate,
      emoji: body.emoji ?? '🧳',
      coverImage: body.coverImage ?? '',
      ownerId: body.owner?.id,
      owner: body.owner
        ? {
            id: body.owner.id,
            name: body.owner.name,
            email: body.owner.email,
            initials: body.owner.initials,
            color: body.owner.color,
          }
        : undefined,
    });

    return NextResponse.json({ data: { trip } }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create trip' },
      { status: 500 },
    );
  }
}
