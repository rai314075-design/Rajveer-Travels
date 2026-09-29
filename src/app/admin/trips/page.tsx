"use client";

import { useEffect, useState } from "react";

type Bus = { id: string; busNumber: string; ownerPhone?: string | null; pickupLocation?: string | null; dropLocation?: string | null };
type RouteRow = { id: string; source: string; destination: string; pickupPoint?: string | null; dropPoint?: string | null };
type Trip = {
  id: string;
  travelDate: string;
  departureTime: string;
  arrivalTime: string;
  fare: string;
  bus: Bus;
  route: RouteRow;
};

export default function AdminTripsPage() {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [routes, setRoutes] = useState<RouteRow[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [form, setForm] = useState({
    busId: "",
    routeId: "",
    travelDate: "",
    departureTime: "",
    arrivalTime: "",
    fare: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadAll() {
    const [busesRes, routesRes, tripsRes] = await Promise.all([
      fetch("/api/admin/buses"),
      fetch("/api/admin/routes"),
      fetch("/api/admin/trips"),
    ]);
    setBuses(await busesRes.json());
    setRoutes(await routesRes.json());
    setTrips(await tripsRes.json());
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        fare: Number(form.fare),
        departureTime: `${form.travelDate}T${form.departureTime}:00`,
        arrivalTime: `${form.travelDate}T${form.arrivalTime}:00`,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error?.formErrors?.join(", ") || "Failed to schedule trip");
      return;
    }
    setForm({ busId: "", routeId: "", travelDate: "", departureTime: "", arrivalTime: "", fare: "" });
    loadAll();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Schedule Trips</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-4 grid sm:grid-cols-3 gap-3 mb-8">
        <select value={form.busId} onChange={(e) => setForm({ ...form, busId: e.target.value })} required className="border rounded-lg px-3 py-2">
          <option value="">Select bus</option>
          {buses.map((b) => (
            <option key={b.id} value={b.id}>{b.busNumber}</option>
          ))}
        </select>
        <select value={form.routeId} onChange={(e) => setForm({ ...form, routeId: e.target.value })} required className="border rounded-lg px-3 py-2">
          <option value="">Select route</option>
          {routes.map((r) => (
            <option key={r.id} value={r.id}>{r.source} → {r.destination}</option>
          ))}
        </select>
        <input type="date" value={form.travelDate} onChange={(e) => setForm({ ...form, travelDate: e.target.value })} required className="border rounded-lg px-3 py-2" />
        <input type="time" placeholder="Departure" value={form.departureTime} onChange={(e) => setForm({ ...form, departureTime: e.target.value })} required className="border rounded-lg px-3 py-2" />
        <input type="time" placeholder="Arrival" value={form.arrivalTime} onChange={(e) => setForm({ ...form, arrivalTime: e.target.value })} required className="border rounded-lg px-3 py-2" />
        <input type="number" placeholder="Fare (₹)" value={form.fare} onChange={(e) => setForm({ ...form, fare: e.target.value })} required className="border rounded-lg px-3 py-2" />
        <button disabled={loading} className="bg-brand-600 hover:bg-brand-700 text-white rounded-lg px-4 py-2 sm:col-span-3">
          {loading ? "Scheduling..." : "Schedule Trip"}
        </button>
      </form>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="bg-white rounded-xl shadow divide-y">
        {trips.map((t) => (
          <div key={t.id} className="p-4 flex justify-between text-sm">
            <span className="font-medium">{t.bus.busNumber} — {t.route.source} → {t.route.destination}</span>
            <span className="text-gray-500">{new Date(t.travelDate).toLocaleDateString()}</span>
            <span className="text-gray-500">{new Date(t.departureTime).toLocaleTimeString()}</span>
            <span className="font-semibold text-brand-700">₹{t.fare}</span>
          </div>
        ))}
        {trips.length === 0 && <p className="p-4 text-gray-400">No trips scheduled yet.</p>}
      </div>
    </div>
  );
}
