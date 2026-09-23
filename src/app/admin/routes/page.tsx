"use client";

import { useEffect, useState } from "react";

type RouteRow = {
  id: string;
  source: string;
  destination: string;
  pickupPoint?: string | null;
  dropPoint?: string | null;
  distanceKm: number;
  durationMins: number;
};

export default function AdminRoutesPage() {
  const [routes, setRoutes] = useState<RouteRow[]>([]);
  const [form, setForm] = useState({ source: "", destination: "", pickupPoint: "", dropPoint: "", distanceKm: 0, durationMins: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadRoutes() {
    const res = await fetch("/api/admin/routes");
    setRoutes(await res.json());
  }

  useEffect(() => {
    loadRoutes();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/routes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        distanceKm: Number(form.distanceKm),
        durationMins: Number(form.durationMins),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error?.formErrors?.join(", ") || "Failed to add route");
      return;
    }
    setForm({ source: "", destination: "", pickupPoint: "", dropPoint: "", distanceKm: 0, durationMins: 0 });
    loadRoutes();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Manage Routes</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-4 grid sm:grid-cols-6 gap-3 mb-8">
        <input placeholder="Source city" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} required className="border rounded-lg px-3 py-2" />
        <input placeholder="Destination city" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} required className="border rounded-lg px-3 py-2" />
        <input placeholder="Pickup point" value={form.pickupPoint} onChange={(e) => setForm({ ...form, pickupPoint: e.target.value })} className="border rounded-lg px-3 py-2" />
        <input placeholder="Drop point" value={form.dropPoint} onChange={(e) => setForm({ ...form, dropPoint: e.target.value })} className="border rounded-lg px-3 py-2" />
        <input type="number" placeholder="Distance (km)" value={form.distanceKm || ""} onChange={(e) => setForm({ ...form, distanceKm: Number(e.target.value) })} required className="border rounded-lg px-3 py-2" />
        <input type="number" placeholder="Duration (mins)" value={form.durationMins || ""} onChange={(e) => setForm({ ...form, durationMins: Number(e.target.value) })} required className="border rounded-lg px-3 py-2" />
        <button disabled={loading} className="bg-brand-600 hover:bg-brand-700 text-white rounded-lg px-4 py-2 sm:col-span-6">
          {loading ? "Adding..." : "Add Route"}
        </button>
      </form>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="bg-white rounded-xl shadow divide-y">
        {routes.map((r) => (
          <div key={r.id} className="p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="font-medium">{r.source} → {r.destination}</span>
              <div className="text-xs text-gray-500">
                {r.pickupPoint ? `Pickup: ${r.pickupPoint}` : "Pickup: default route start"}
                {" · "}
                {r.dropPoint ? `Drop: ${r.dropPoint}` : "Drop: default route end"}
              </div>
            </div>
            <div className="flex gap-4 text-gray-500">
              <span>{r.distanceKm} km</span>
              <span>{r.durationMins} mins</span>
            </div>
          </div>
        ))}
        {routes.length === 0 && <p className="p-4 text-gray-400">No routes added yet.</p>}
      </div>
    </div>
  );
}
