import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminDashboard() {
  const [busCount, routeCount, tripCount, bookingCount, upcomingTrips, recentBookings] = await Promise.all([
    prisma.bus.count({ where: { isActive: true } }),
    prisma.route.count({ where: { isActive: true } }),
    prisma.trip.count({ where: { isActive: true } }),
    prisma.booking.count({ where: { status: "CONFIRMED" } }),
    prisma.trip.findMany({
      where: { isActive: true, departureTime: { gte: new Date() } },
      include: { bus: true, route: true },
      orderBy: { departureTime: "asc" },
      take: 4,
    }),
    prisma.booking.findMany({
      include: { user: true, trip: { include: { route: true } } },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
  ]);

  const stats = [
    { label: "Buses", value: busCount },
    { label: "Routes", value: routeCount },
    { label: "Scheduled Trips", value: tripCount },
    { label: "Confirmed Bookings", value: bookingCount },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl bg-gray-950 px-6 py-7 text-white md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-300">Operations centre</p>
          <h1 className="mt-2 text-3xl font-bold">Good day, admin.</h1>
          <p className="mt-1 text-sm text-gray-300">Keep the fleet, routes, and bookings moving from one place.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/buses" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold hover:bg-brand-700">Add bus</Link>
          <Link href="/admin/trips" className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-semibold hover:bg-gray-800">Schedule trip</Link>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s, index) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className={`text-3xl font-bold ${index === 0 ? "text-brand-700" : "text-gray-950"}`}>{s.value}</p>
            <p className="mt-1 text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b px-5 py-4"><h2 className="font-semibold">Upcoming departures</h2><Link href="/admin/trips" className="text-sm font-medium text-brand-700">View all</Link></div>
          <div className="divide-y">
            {upcomingTrips.map((trip) => <div key={trip.id} className="flex items-center justify-between gap-4 px-5 py-4"><div><p className="font-medium">{trip.route.source} → {trip.route.destination}</p><p className="text-xs text-gray-500">{trip.bus.busNumber} · {trip.departureTime.toLocaleString()}</p></div><span className="text-sm font-semibold text-gray-700">₹{trip.fare.toString()}</span></div>)}
            {upcomingTrips.length === 0 && <p className="px-5 py-6 text-sm text-gray-500">No upcoming trips scheduled.</p>}
          </div>
        </section>
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b px-5 py-4"><h2 className="font-semibold">Recent bookings</h2><Link href="/admin/notifications" className="text-sm font-medium text-brand-700">Open activity</Link></div>
          <div className="divide-y">
            {recentBookings.map((booking) => <div key={booking.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{booking.user.name}</p><p className="text-xs text-gray-500">{booking.trip.route.source} → {booking.trip.route.destination}</p><p className="mt-1 text-sm font-semibold text-gray-700">{booking.user.phone ? <a href={`tel:${booking.user.phone}`} className="text-brand-700 hover:text-brand-900">☎ {booking.user.phone}</a> : "Phone not provided"}</p></div><div className="flex items-center gap-3"><span className="rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">{booking.status}</span>{booking.user.phone && <a href={`tel:${booking.user.phone}`} className="rounded-lg border border-brand-200 px-3 py-1 text-sm font-semibold text-brand-700 hover:bg-brand-50">Call</a>}</div></div>)}
            {recentBookings.length === 0 && <p className="px-5 py-6 text-sm text-gray-500">No bookings yet.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
