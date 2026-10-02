import { prisma } from "@/lib/prisma";
import AdminBookingActions from "../AdminBookingActions";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  const bookings = await prisma.booking.findMany({
    include: { user: true, trip: { include: { route: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">All bookings</h1>
        <p className="mt-1 text-sm text-gray-500">Review every ticket and cancel active bookings when needed.</p>
      </div>
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <AdminBookingActions bookings={bookings.map((booking) => ({ id: booking.id, status: booking.status, name: booking.user.name, phone: booking.user.phone, source: booking.trip.route.source, destination: booking.trip.route.destination }))} />
      </section>
    </div>
  );
}