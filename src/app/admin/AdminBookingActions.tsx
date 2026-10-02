"use client";

import { useState } from "react";

type Booking = { id: string; status: string; name: string; phone: string | null; source: string; destination: string };

export default function AdminBookingActions({ bookings }: { bookings: Booking[] }) {
  const [items, setItems] = useState(bookings);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  async function cancelBooking(booking: Booking) {
    if (!window.confirm(`Cancel ${booking.name}'s ticket?`)) return;
    setBusyId(booking.id);
    setNotice("");
    const response = await fetch(`/api/admin/bookings/${booking.id}/cancel`, { method: "POST" });
    const data = await response.json().catch(() => ({}));
    if (response.ok) {
      setItems((current) => current.map((item) => item.id === booking.id ? { ...item, status: "CANCELLED" } : item));
      setNotice(data.message);
    } else setNotice(data.error || "Could not cancel the ticket.");
    setBusyId(null);
  }

  return <>
    <div className="divide-y">
      {items.map((booking) => <div key={booking.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{booking.name}</p><p className="text-xs text-gray-500">{booking.source} → {booking.destination}</p><p className="mt-1 text-sm font-semibold text-gray-700">{booking.phone ? <a href={`tel:${booking.phone}`} className="text-brand-700 hover:text-brand-900">☎ {booking.phone}</a> : "Phone not provided"}</p></div><div className="flex items-center gap-3"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${booking.status === "CANCELLED" ? "bg-gray-100 text-gray-600" : "bg-green-50 text-green-700"}`}>{booking.status}</span>{booking.phone && <a href={`tel:${booking.phone}`} className="rounded-lg border border-brand-200 px-3 py-1 text-sm font-semibold text-brand-700 hover:bg-brand-50">Call</a>}{["CONFIRMED", "PENDING"].includes(booking.status) && <button type="button" onClick={() => cancelBooking(booking)} disabled={busyId === booking.id} className="rounded-lg border border-red-200 px-3 py-1 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">{busyId === booking.id ? "Cancelling..." : "Cancel ticket"}</button>}</div></div>)}
      {items.length === 0 && <p className="px-5 py-6 text-sm text-gray-500">No bookings yet.</p>}
    </div>
    {notice && <p className="border-t px-5 py-3 text-sm text-gray-700">{notice}</p>}
  </>;
}