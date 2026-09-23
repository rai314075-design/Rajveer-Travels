import { getSession } from "@auth0/nextjs-auth0";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
          bus: { select: { busNumber: true } },
          route: { select: { source: true, destination: true, pickupPoint: true, dropPoint: true } },
        },
      },
    },
  });
  return NextResponse.json(bookings);
}