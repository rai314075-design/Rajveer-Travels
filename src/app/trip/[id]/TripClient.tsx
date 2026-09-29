"use client";

import { useState } from "react";
import { SeatMap } from "@/components/seats/SeatMap";

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

interface TripClientProps {
  trip: TripData;
  userId: string | null;
  tripId: string;
}

export function TripClient({ trip, userId, tripId }: TripClientProps) {
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

  const handleSeatSelect = (seatIds: string[]) => {
    setSelectedSeats((prev) => {
      const next = new Set([...prev, ...seatIds]);
      return Array.from(next);
    });
  };

  const handleSeatDeselect = (seatIds: string[]) => {
    setSelectedSeats((prev) => prev.filter((id) => !seatIds.includes(id)));
  };

  const calculateTotal = () => {
    if (selectedSeats.length === 0) return 0;
    return Number(trip.fare ?? 0) * selectedSeats.length;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Trip Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {trip.bus.operator} — {trip.bus.busNumber}
          </h1>
          <p className="text-gray-600 mb-4">
            {trip.route.source} → {trip.route.destination}
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
            <div>
              <p className="font-medium">{trip.travelDate}</p>
            </div>
            <div>
              <p className="font-medium">
                {trip.departureTime} → {trip.arrivalTime}
              </p>
            </div>
            <div>
              <p className="font-medium">Fare: ₹{trip.fare}</p>
            </div>
            <div>
              <p className="font-medium">
                Seats: {trip.seats.length} total
              </p>
            </div>
          </div>
        </div>

        {/* Seat Selection */}
        {!userId ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">
              Please log in to select seats
            </h2>
            <p className="mb-4">
              You need to be logged in to book seats. Please{" "}
              <a
                href={"/api/auth/login?returnTo=/trip/" + tripId}
                className="text-brand-600 hover:text-purple-600 underline"
              >
                log in
              </a>{" "}
              to continue.
            </p>
          </div>
        ) : (
          <>
            <SeatMap
              tripId={tripId}
              onSeatSelect={handleSeatSelect}
              onSeatDeselect={handleSeatDeselect}
              initialSelection={selectedSeats}
            />

            {selectedSeats.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-bold mb-4">
                  Selected Seats ({selectedSeats.length})
                </h2>
                <div className="bg-white rounded-xl shadow p-6">
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">
                      Selected seats:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedSeats.map((seatId) => {
                        const seat = trip.seats.find(
                          (s) => s.seatTemplateId === seatId
                        );
                        if (!seat) return null;
                        return (
                          <span
                            key={seatId}
                            className="px-3 py-1 bg-blue-50 text-blue-800 text-xs rounded"
                          >
                            {seat.seatNumber}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-2">Total:</p>
                    <p className="text-2xl font-bold text-brand-700">
                      ₹{calculateTotal()}
                    </p>
                    <button
                      onClick={() => {
                        alert(
                          `Proceeding to payment for ₹${calculateTotal()} for ${selectedSeats.length} seat(s)`
                        );
                      }}
                      className="w-full mt-4 bg-brand-600 hover:bg-brand-700 text-white py-3 px-6 rounded-lg font-medium"
                    >
                      Proceed to Payment
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}