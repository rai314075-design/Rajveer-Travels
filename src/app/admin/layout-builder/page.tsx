"use client";

import { useEffect, useState } from "react";
import { LayoutBuilder } from "@/components/admin/LayoutBuilder";
import { Preset } from "@/types/seat";

interface Vehicle {
  id: string;
  name: string;
  totalDecks: number;
}

export default function AdminLayoutBuilderPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [vehiclesRes, presetsRes] = await Promise.all([
        fetch("/api/vehicles"),
        fetch("/api/templates/preset"),
      ]);

      const vehiclesData = await vehiclesRes.json();
      const presetsData = await presetsRes.json();

      setVehicles(vehiclesData);
      setPresets(presetsData);

      // Auto-select first vehicle if available
      if (vehiclesData.length > 0) {
        setSelectedVehicle(vehiclesData[0].id);
      }

      setIsLoading(false);
    }

    loadData();
  }, []);

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Layout Builder</h1>
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Layout Builder</h1>

      {vehicles.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <p className="text-gray-500 mb-4">
            No vehicles configured yet. Create a bus first.
          </p>
          <a
            href="/admin/buses"
            className="inline-block bg-brand-600 hover:bg-brand-700 text-white rounded-lg px-4 py-2"
          >
            Manage Buses
          </a>
        </div>
      ) : (
        <div className="grid gap-6">
          {/* Vehicle Selector */}
          <div className="bg-white rounded-xl shadow p-4">
            <label className="block text-sm font-medium mb-2">Select Vehicle</label>
            <select
              value={selectedVehicle || ""}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="border rounded-lg px-3 py-2 w-full max-w-xs"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.totalDecks} deck{v.totalDecks > 1 ? "s" : ""})
                </option>
              ))}
            </select>
          </div>

          {/* Layout Builder */}
          {selectedVehicle && (
            <LayoutBuilder
              vehicleId={selectedVehicle}
              preset={
                presets.find((p) => p.id === "2plus1-sleeper")
              }
            />
          )}
        </div>
      )}
    </div>
  );
}