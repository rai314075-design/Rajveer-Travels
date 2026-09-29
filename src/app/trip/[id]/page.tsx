import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/prisma";
import { TripClient } from "./TripClient";
import { Metadata } from "next";

interface TripData {
  id: string;
  bus: {
    operator: string;
    busNumber: string;
  };
  route: {
    source: string;
    destination: string;
  };
  travelDate: string; // DD/MM/YYYY
  departureTime: string; // HH:mm
  arrivalTime: string; // HH:mm
  fare: number;
  seats: Array<{
    id: string;
    seatNumber: string;
    status: string;
    seatTemplateId: string;
  }>;
}

/**
 * Format date as DD/MM/YYYY
 */
function formatDate(date: Date): string {
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

/**
 * Format time as HH:mm (24-hour)
 */
function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const trip = await prisma.trip.findUnique({
    where: { id: params.id },
    include: { bus: true, route: true },
  });
  if (!trip) return { title: "Trip Not Found" };
  return {
    title: `${trip.bus.operator} — ${trip.bus.busNumber} | ${trip.route.source} → ${trip.route.destination}`,
  };
}

export default async function TripPage({ params }: { params: { id: string } }) {
  const tripId = params.id;

  // Fetch trip data
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
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
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Trip not found</h1>
        <p>The requested trip does not exist or has no bus assigned.</p>
        <a href="/" className="text-brand-600 hover:text-purple-600">
          ← Back to home
        </a>
      </div>
    );
  }

  // Check auth server-side
  const session = await getSession();
  let userId: string | null = null;
  if (session?.user?.sub) {
    const user = await prisma.user.findUnique({
      where: { auth0Id: session.user.sub },
      select: { id: true },
    });
    userId = user?.id ?? null;
  }

  const tripData: TripData = {
    id: trip.id,
    bus: {
      operator: trip.bus.operator,
      busNumber: trip.bus.busNumber,
    },
    route: {
      source: trip.route.source,
      destination: trip.route.destination,
    },
    travelDate: formatDate(trip.travelDate),
    departureTime: formatTime(trip.departureTime),
    arrivalTime: formatTime(trip.arrivalTime),
    fare: Number(trip.fare),
    seats: trip.seats.map((s) => ({
      id: s.id,
      seatNumber: s.seatNumber,
      status: s.status,
      seatTemplateId: s.id, // Using seat.id as templateId for now
    })),
  };

  return <TripClient trip={tripData} userId={userId} tripId={tripId} />;
}