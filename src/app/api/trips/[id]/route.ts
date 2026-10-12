import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
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

/**
 * DELETE /api/trips/[id]
 *
 * Deletes a scheduled trip. Admin only.
 * Blocked when the trip has active (CONFIRMED) bookings — the operator must
 * cancel or move those bookings first.
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return NextResponse.json({ error: guard.message }, { status: guard.status });

  const trip = await prisma.trip.findUnique({
    where: { id: params.id },
    include: {
      _count: { select: { bookings: true } },
      bookings: { where: { status: "CONFIRMED" }, select: { id: true } },
    },
  });
  if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  if (trip.bookings.length > 0) {
    return NextResponse.json({ error: "Cancel or move the bookings first" }, { status: 409 });
  }

  await prisma.trip.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}