"use client";

import { useEffect, useState } from "react";

type Bus = {
  id: string;
  busNumber: string;
  type: string;
  totalSeats: number;
  operator: string;
  upiId?: string | null;
  paymentQrUrl?: string | null;
  ownerPhone?: string | null;
  pickupLocation?: string | null;
  dropLocation?: string | null;
};

export default function AdminBusesPage() {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [form, setForm] = useState({
    busNumber: "",
    type: "AC_SEATER",
    totalSeats: 40,
    upiId: "",
    paymentQrUrl: "",
    ownerPhone: "",
    pickupLocation: "",
    dropLocation: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadBuses() {
    const res = await fetch("/api/admin/buses");
    setBuses(await res.json());
  }

  useEffect(() => {
    loadBuses();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/buses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, totalSeats: Number(form.totalSeats) }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error?.formErrors?.join(", ") || "Failed to add bus");
      return;
    }
    setForm({ busNumber: "", type: "AC_SEATER", totalSeats: 40, upiId: "", paymentQrUrl: "", ownerPhone: "", pickupLocation: "", dropLocation: "" });
    loadBuses();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Manage Buses</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        <input
          placeholder="Bus number (e.g. RJ-101)"
          value={form.busNumber}
          onChange={(e) => setForm({ ...form, busNumber: e.target.value })}
          required
          className="border rounded-lg px-3 py-2"
        />
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          className="border rounded-lg px-3 py-2"
        >
          <option value="AC_SEATER">AC Seater</option>
          <option value="AC_SLEEPER">AC Sleeper</option>
          <option value="NON_AC_SEATER">Non-AC Seater</option>
          <option value="NON_AC_SLEEPER">Non-AC Sleeper</option>
        </select>
        <input
          type="number"
          min={1}
          placeholder="Total seats"
          value={form.totalSeats}
          onChange={(e) => setForm({ ...form, totalSeats: Number(e.target.value) })}
          required
          className="border rounded-lg px-3 py-2"
        />
        <input
          placeholder="UPI ID (name@upi)"
          value={form.upiId}
          onChange={(e) => setForm({ ...form, upiId: e.target.value })}
          className="border rounded-lg px-3 py-2"
        />
        <input
          placeholder="QR image URL"
          value={form.paymentQrUrl}
          onChange={(e) => setForm({ ...form, paymentQrUrl: e.target.value })}
          className="border rounded-lg px-3 py-2"
        />
        <input
          placeholder="Owner phone number"
          value={form.ownerPhone}
          onChange={(e) => setForm({ ...form, ownerPhone: e.target.value })}
          className="border rounded-lg px-3 py-2"
        />
        <input
          placeholder="Pickup location"
          value={form.pickupLocation}
          onChange={(e) => setForm({ ...form, pickupLocation: e.target.value })}
          className="border rounded-lg px-3 py-2"
        />
        <input
          placeholder="Drop location"
          value={form.dropLocation}
          onChange={(e) => setForm({ ...form, dropLocation: e.target.value })}
          className="border rounded-lg px-3 py-2"
        />
        <button disabled={loading} className="lg:col-span-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg px-4 py-2">
          {loading ? "Adding..." : "Add Bus"}
        </button>
      </form>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="bg-white rounded-xl shadow divide-y">
        {buses.map((b) => (
          <div key={b.id} className="p-4 grid md:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-start">
            <span className="font-medium">{b.busNumber}</span>
            <span className="text-gray-500">{b.type.replace(/_/g, " ")}</span>
            <span className="text-gray-500">{b.totalSeats} seats</span>
            <div className="text-right">
              {b.upiId && <div className="text-sm text-brand-700">UPI: {b.upiId}</div>}
              {b.paymentQrUrl && (
                <img src={b.paymentQrUrl} alt={`${b.busNumber} payment QR`} className="h-16 w-16 object-cover rounded border mt-1 ml-auto" />
              )}
            </div>
            <div className="md:col-span-3 text-sm text-gray-600 space-y-1">
              {b.ownerPhone && <div>Owner: {b.ownerPhone}</div>}
              {b.pickupLocation && <div>Pickup: {b.pickupLocation}</div>}
              {b.dropLocation && <div>Drop: {b.dropLocation}</div>}
            </div>
          </div>
        ))}
        {buses.length === 0 && <p className="p-4 text-gray-400">No buses added yet.</p>}
      </div>
    </div>
  );
}
