import { prisma } from "@/lib/prisma";

export default async function AdminDashboard() {
  const [busCount, routeCount, tripCount, bookingCount] = await Promise.all([
    prisma.bus.count(),
    prisma.route.count(),
    prisma.trip.count(),
    prisma.booking.count({ where: { status: "CONFIRMED" } }),
  ]);

  const stats = [
    { label: "Buses", value: busCount },
    { label: "Routes", value: routeCount },
    { label: "Scheduled Trips", value: tripCount },
    { label: "Confirmed Bookings", value: bookingCount },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Rajveer Travels — Admin Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow p-4">
            <p className="text-3xl font-bold text-brand-700">{s.value}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
