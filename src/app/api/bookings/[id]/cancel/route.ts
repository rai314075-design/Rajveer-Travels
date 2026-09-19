import { getSession } from "@auth0/nextjs-auth0";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyAdminsByEmailAndSms } from "@/lib/adminNotifications";
import { z } from "zod";

const schema = z.object({ upiId: z.string().trim().min(3).max(255) });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.user?.sub) return NextResponse.json({ error: "Log in to cancel a booking" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { auth0Id: session.user.sub } });
  if (!user) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "UPI ID is required for the refund" }, { status: 400 });

  const booking = await prisma.booking.findFirst({
    where: { id: params.id, userId: user.id, status: { in: ["CONFIRMED", "PENDING"] } },
    include: { payment: true, trip: { include: { bus: true, route: true } } },
  });
  if (!booking || !booking.payment || booking.payment.status !== "PAID") return NextResponse.json({ error: "A paid booking is required" }, { status: 400 });
  const hoursUntilDeparture = (booking.trip.departureTime.getTime() - Date.now()) / (1000 * 60 * 60);
  if (hoursUntilDeparture <= 0) return NextResponse.json({ error: "This trip has already departed" }, { status: 400 });
  if (await prisma.refundRequest.findUnique({ where: { bookingId: booking.id } })) return NextResponse.json({ error: "A cancellation request already exists" }, { status: 409 });

  const lastMinute = hoursUntilDeparture <= 24;
  const amount = booking.totalAmount.mul(lastMinute ? 0.5 : 1);
  const refund = await prisma.refundRequest.create({ data: { userId: user.id, bookingId: booking.id, upiId: parsed.data.upiId, amount } });
  await notifyAdminsByEmailAndSms("New cancellation request", `Booking ${booking.id}\nCustomer: ${user.name}\nPhone: ${user.phone || "Not provided"}\nBus: ${booking.trip.bus.busNumber}\nRoute: ${booking.trip.route.source} to ${booking.trip.route.destination}\nDeparture: ${booking.trip.departureTime.toLocaleString()}\nRefund requested: INR ${amount}\nPolicy: ${lastMinute ? "Last-minute cancellation: 50% refund" : "Standard cancellation: admin review"}\nUPI: ${refund.upiId}`);
  return NextResponse.json({ success: true, refundId: refund.id, amount: amount.toString(), lastMinute });
}