import { getSession } from "@auth0/nextjs-auth0";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCustomSession } from "@/lib/session";
import { sendBookingCreatedAlerts } from "@/lib/adminNotifications";
import { z } from "zod";

const createBookingSchema = z.object({
  tripId: z.string(),
  seatTemplateIds: z.array(z.string()).min(1).max(6),
});

export async function GET() {
  const session = await getSession();
  if (!session?.user?.sub) return NextResponse.json({ error: "Log in to view bookings" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { auth0Id: session.user.sub }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const bookings = await prisma.booking.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      passengerInfo: true,
      trip: {
        select: {
          departureTime: true,
          arrivalTime: true,
          bus: { select: { busNumber: true, ownerPhone: true, pickupLocation: true, dropLocation: true } },
          route: { select: { source: true, destination: true, pickupPoint: true, dropPoint: true } },
        },
      },
    },
  });
  return NextResponse.json(bookings);
}

export async function POST(req: Request) {
  const sessionUser = await getCustomSession();
  if (!sessionUser) return NextResponse.json({ error: "Please log in to book a ticket" }, { status: 401 });

  const parsed = createBookingSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const result = await prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({
      where: { id: parsed.data.tripId },
      include: { bus: true, route: true, vehicle: { include: { seatTemplates: true } } },
    });
    if (!trip) throw new Error("Trip not found");

    const templateSeatNumbers = new Map((trip.vehicle?.seatTemplates || []).map((seat) => [seat.id, seat.seatNumber]));
    const seatNumbers = parsed.data.seatTemplateIds.map((id) => templateSeatNumbers.get(id)).filter((seat): seat is string => Boolean(seat));
    if (seatNumbers.length !== parsed.data.seatTemplateIds.length) throw new Error("One or more selected seats are invalid");

    const seats = await tx.seat.findMany({ where: { tripId: trip.id, seatNumber: { in: seatNumbers } } });
    if (seats.length !== seatNumbers.length || seats.some((seat) => seat.status !== "AVAILABLE")) throw new Error("One or more selected seats are no longer available");

    const booking = await tx.booking.create({
      data: {
        userId: sessionUser.id,
        tripId: trip.id,
        passengerInfo: { seatNumbers },
        totalAmount: Number(trip.fare) * seats.length,
        status: "CONFIRMED",
      },
    });
    await tx.seat.updateMany({ where: { id: { in: seats.map((seat) => seat.id) } }, data: { status: "BOOKED", bookingId: booking.id } });

    return { booking, bus: trip.bus, route: trip.route, departureTime: trip.departureTime };
  });

  try {
    await sendBookingCreatedAlerts({
      bookingId: result.booking.id,
      customerName: sessionUser.name,
      customerEmail: sessionUser.email,
      customerPhone: sessionUser.phone || null,
      busNumber: result.bus.busNumber,
      busOwnerPhone: result.bus.ownerPhone,
      pickupLocation: result.bus.pickupLocation,
      dropLocation: result.bus.dropLocation,
      departureTime: result.departureTime,
      source: result.route.source,
      destination: result.route.destination,
    });
  } catch (error) {
    console.error("Booking saved but notification delivery failed", error);
  }

  return NextResponse.json({
    bookingId: result.booking.id,
    status: result.booking.status,
    total: Number(result.booking.totalAmount),
    seats: result.booking.passengerInfo,
    ownerName: result.bus.operator,
    ownerPhone: result.bus.ownerPhone,
    message: "Your ticket is booked. The bus owner will call you soon.",
  }, { status: 201 });
}