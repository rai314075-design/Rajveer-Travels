import { prisma } from "@/lib/prisma";
import { getCustomSession } from "@/lib/session";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { source?: string; destination?: string; date?: string };
}) {
  const { source, destination, date } = searchParams;
  const user = await getCustomSession();
  const language = user?.language || "ENGLISH";
  const hindi = language === "HINDI";
  const canBook = Boolean(user?.phoneVerified && user?.emailVerified);

  const now = new Date();

  const trips = await prisma.trip.findMany({
    where: {
      ...(date && {
        travelDate: {
          gte: new Date(`${date}T00:00:00`),
          lte: new Date(`${date}T23:59:59`),
        },
      }),
      route: {
        ...(source && { source: { equals: source, mode: "insensitive" } }),
        ...(destination && { destination: { equals: destination, mode: "insensitive" } }),
      },
      departureTime: {
        gt: now,
      },
    },
    include: { bus: true, route: true },
    orderBy: { departureTime: "asc" },
  });

  return (
    <section className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-6">
        {source} → {destination} {hindi ? "की तारीख" : "on"} {date}
      </h1>

      {!canBook && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {hindi ? "आप बस का समय, मार्ग, जानकारी और किराया देख सकते हैं। बुकिंग के लिए लॉग इन या रजिस्टर करें, Auth0 में ईमेल सत्यापित करें और प्रोफ़ाइल में फोन OTP सत्यापित करें।" : "You can view bus times, routes, details, and prices. To book a bus, log in or register, verify your Gmail in Auth0, and verify your phone with the OTP in your profile."}
        </div>
      )}

      {trips.length === 0 && <p className="text-gray-500">{hindi ? "इस मार्ग और तारीख के लिए कोई बस नहीं मिली।" : "No buses found for this route/date."}</p>}

      <div className="space-y-4">
        {trips.map((trip) => (
          <div key={trip.id} className="border rounded-xl p-4 flex justify-between items-center bg-white shadow-sm">
            <div>
              <p className="font-semibold">{trip.bus.operator} — {trip.bus.busNumber}</p>
              <p className="text-sm text-gray-500">{trip.bus.type.replace(/_/g, " ")}</p>
              <p className="text-sm mt-1">
                {hindi ? "प्रस्थान" : "Departure"} {new Date(trip.departureTime).toLocaleTimeString()} → {hindi ? "आगमन" : "Arrival"} {new Date(trip.arrivalTime).toLocaleTimeString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {trip.route.pickupPoint || trip.route.source} → {trip.route.dropPoint || trip.route.destination}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-brand-700">₹{trip.fare.toString()}</p>
              <a href={canBook ? `/trip/${trip.id}` : "/profile"} className="text-sm font-medium text-brand-600 hover:text-purple-700">
                {canBook
                  ? (hindi ? "सीट चुनें →" : "Select seats →")
                  : (hindi ? "बुकिंग के लिए फोन सत्यापित करें" : "Add and verify your phone number to book")}
              </a>
              {trip.bus.upiId && (
                <p className="mt-2 text-xs text-gray-700">UPI: {trip.bus.upiId}</p>
              )}
              {trip.bus.paymentQrUrl && (
                <img
                  src={trip.bus.paymentQrUrl}
                  alt={`${trip.bus.busNumber} payment QR`}
                  className="mt-2 h-16 w-16 rounded border object-cover ml-auto"
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
