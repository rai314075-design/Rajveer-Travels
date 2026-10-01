import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectMongo } from "@/lib/mongodb";
import Bus from "@/models/Bus";
import BusLayout from "@/models/BusLayout";
export const dynamic = "force-dynamic";


export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!mongoose.Types.ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: "Invalid bus id" }, { status: 400 });
  }

  await connectMongo();
  const bus = await Bus.findById(params.id).lean();
  if (!bus) return NextResponse.json({ error: "Bus not found" }, { status: 404 });
  const mongoBus = bus as unknown as { _id: unknown; busNumber: string; operator: string; description?: string | null };

  const layout = await BusLayout.findOne({ busId: mongoBus._id }).lean();
  if (!layout) return NextResponse.json({ error: "Bus layout not configured" }, { status: 404 });
  const mongoLayout = layout as unknown as { _id: unknown; rows: number; cols: number; decks: string[]; seats: unknown[] };

  return NextResponse.json({
    bus: { id: String(mongoBus._id), busNumber: mongoBus.busNumber, operator: mongoBus.operator, description: mongoBus.description || "" },
    layout: {
      id: String(mongoLayout._id),
      rows: mongoLayout.rows,
      cols: mongoLayout.cols,
      decks: mongoLayout.decks,
      seats: mongoLayout.seats,
    },
  });
}
