"use client";

import { useEffect, useState } from "react";

type Bus = { id: string; busNumber: string; ownerPhone?: string | null; pickupLocation?: string | null; dropLocation?: string | null };
type RouteRow = { id: string; source: string; destination: string; pickupPoint?: string | null; dropPoint?: string | null };
type Vehicle = { id: string; name: string; totalDecks: number; seatTemplates?: unknown[] };
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
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [form, setForm] = useState({
    busId: "",
    routeId: "",
    vehicleId: "",
    travelDate: "",
    departureTime: "",
    arrivalTime: "",
    fare: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function loadAll() {
    const [busesRes, routesRes, tripsRes] = await Promise.all([
      fetch("/api/admin/buses"),
      fetch("/api/admin/routes"),
      fetch("/api/admin/trips"),
    ]);
    setBuses(await busesRes.json());
    setRoutes(await routesRes.json());
    setTrips(await tripsRes.json());
    const vehiclesRes = await fetch("/api/vehicles");
    setVehicles(await vehiclesRes.json());
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
    setForm({ busId: "", routeId: "", vehicleId: "", travelDate: "", departureTime: "", arrivalTime: "", fare: "" });
    loadAll();
  }

  async function handleRemove(trip: Trip) {
    if (!window.confirm("Remove this scheduled trip from active listings?")) return;
    setRemovingId(trip.id);
    setError("");
    const res = await fetch(`/api/admin/trips?id=${encodeURIComponent(trip.id)}`, { method: "DELETE" });
    setRemovingId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error || "Failed to remove trip");
      return;
    }
    setTrips((current) => current.filter((item) => item.id !== trip.id));
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Schedule Trips</h1>
      <p className="mb-6 max-w-2xl rounded-lg bg-blue-50 p-3 text-sm text-blue-900">This is where a route becomes connected to a specific bus. Choose the bus, route, and matching seat layout before scheduling.</p>

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
        <div>
          <select value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} required className="w-full border rounded-lg px-3 py-2">
            <option value="">Select seat layout</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.name} · {vehicle.seatTemplates?.length || 0} seats · {vehicle.totalDecks} deck{vehicle.totalDecks > 1 ? "s" : ""}
              </option>
            ))}
          </select>
          <a href={form.busId ? `/admin/bus/create?busNumber=${encodeURIComponent(buses.find((bus) => bus.id === form.busId)?.busNumber || "")}` : "/admin/bus/create"} className="mt-1 inline-block text-xs font-semibold text-brand-700 hover:text-brand-900">Create a new layout for this bus</a>
        </div>
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
          <div key={t.id} className="p-4 flex flex-wrap items-center justify-between gap-3 text-sm">
            <span className="font-medium">{t.bus.busNumber} — {t.route.source} → {t.route.destination}</span>
            <span className="text-gray-500">{new Date(t.travelDate).toLocaleDateString()}</span>
            <span className="text-gray-500">{new Date(t.departureTime).toLocaleTimeString()}</span>
            <span className="font-semibold text-brand-700">₹{t.fare}</span>
            <button type="button" onClick={() => handleRemove(t)} disabled={removingId === t.id} className="rounded-lg border border-red-200 px-3 py-1 font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">
              {removingId === t.id ? "Removing..." : "Remove"}
            </button>
          </div>
        ))}
        {trips.length === 0 && <p className="p-4 text-gray-400">No trips scheduled yet.</p>}
      </div>
    </div>
  );
}
