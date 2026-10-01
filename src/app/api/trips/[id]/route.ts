import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";


/**
 * GET /api/trips/[id]
 *
 * Returns trip details with bus, route, and seat information.
 * Used by the trip detail page for seat selection.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const trip = await prisma.trip.findUnique({
    where: { id: params.id },
    include: {
      bus: true,
      route: true,
      seats: {
        select: {
          id: true,
          seatNumber: true,
          status: true,
          lockedUntil: true,
        },
      },
    },
  });

  if (!trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  return NextResponse.json(trip);
}