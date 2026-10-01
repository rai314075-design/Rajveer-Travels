import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { z } from "zod";
export const dynamic = "force-dynamic";


const tripSchema = z.object({
  busId: z.string(),
  routeId: z.string(),
  vehicleId: z.string().optional(),
  travelDate: z.string(), // ISO date, e.g. "2026-10-05"
  departureTime: z.string(), // full ISO datetime
  arrivalTime: z.string(), // full ISO datetime
  fare: z.number().positive(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const source = searchParams.get("source");
  const destination = searchParams.get("destination");
  const date = searchParams.get("date");

  const now = new Date();

  const trips = await prisma.trip.findMany({
    where: {
      isActive: true,
      ...(date && {
        travelDate: {
          gte: new Date(`${date}T00:00:00`),
          lte: new Date(`${date}T23:59:59`),
        },
      }),
      ...(source || destination
        ? {
            route: {
              ...(source && { source: { equals: source, mode: "insensitive" } }),
              ...(destination && { destination: { equals: destination, mode: "insensitive" } }),
            },
          }
        : {}),
      departureTime: {
        gt: now,
      },
    },
    include: { bus: true, route: true },
    orderBy: { departureTime: "asc" },
  });

  return NextResponse.json(trips);
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return NextResponse.json({ error: guard.message }, { status: guard.status });

  const body = await req.json();
  const parsed = tripSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const bus = await prisma.bus.findUnique({ where: { id: parsed.data.busId } });
  if (!bus) return NextResponse.json({ error: "Bus not found" }, { status: 404 });

  // Find the vehicle for this bus to get its seat templates
  const vehicle = parsed.data.vehicleId
    ? await prisma.vehicle.findFirst({
        where: { id: parsed.data.vehicleId, isActive: true },
        include: { seatTemplates: true },
      })
    : await prisma.vehicle.findFirst({
        where: { isActive: true },
        include: { seatTemplates: true },
      });

  if (parsed.data.vehicleId && !vehicle) {
    return NextResponse.json({ error: "Vehicle layout not found" }, { status: 404 });
  }

  // Create the trip and copy seat templates to Seat entities
  const trip = await prisma.trip.create({
    data: {
      busId: parsed.data.busId,
      routeId: parsed.data.routeId,
      travelDate: new Date(parsed.data.travelDate),
      departureTime: new Date(parsed.data.departureTime),
      arrivalTime: new Date(parsed.data.arrivalTime),
      fare: parsed.data.fare,
      vehicleId: vehicle?.id,
      // Copy seat templates as initial Seat entities for this trip
      seats: {
        create: vehicle?.seatTemplates?.map((template) => ({
          seatNumber: template.seatNumber,
          // Initial status is AVAILABLE
        })) ?? [],
      },
    },
    include: { seats: true },
  });

  return NextResponse.json(trip, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return NextResponse.json({ error: guard.message }, { status: guard.status });

  const tripId = new URL(req.url).searchParams.get("id");
  if (!tripId) return NextResponse.json({ error: "Trip id is required" }, { status: 400 });

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { id: true, _count: { select: { bookings: true } } },
  });
  if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  if (trip._count.bookings > 0) {
    return NextResponse.json({ error: "This trip has bookings and cannot be removed." }, { status: 409 });
  }

  await prisma.trip.update({ where: { id: tripId }, data: { isActive: false } });
  return NextResponse.json({ success: true });
}
