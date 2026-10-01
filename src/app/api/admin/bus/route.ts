import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCustomSession } from "@/lib/session";
import { connectMongo } from "@/lib/mongodb";
import Bus from "@/models/Bus";
import BusLayout from "@/models/BusLayout";

export const dynamic = "force-dynamic";

const seatSchema = z.object({
  seatNo: z.string().trim().min(1).max(12),
  row: z.number().int().min(0).max(19),
  col: z.number().int().min(0).max(11),
  deck: z.enum(["LOWER", "UPPER"]),
  type: z.enum(["SEATER", "SLEEPER"]),
  orientation: z.enum(["VERTICAL", "HORIZONTAL"]),
  price: z.number().min(0),
  genderRestriction: z.enum(["ANY", "FEMALE", "MALE"]),
  status: z.enum(["AVAILABLE", "LOCKED", "BOOKED"]),
});

const layoutSchema = z.object({
  busNumber: z.string().trim().min(2).max(40),
  operator: z.string().trim().min(2).max(100),
  description: z.string().trim().max(1000).optional().default(""),
  rows: z.number().int().min(1).max(20),
  cols: z.number().int().min(1).max(12),
  decks: z.array(z.enum(["LOWER", "UPPER"])).min(1),
  seats: z.array(seatSchema).max(240),
});

async function ensureAdmin() {
  const sessionUser = await getCustomSession();
  if (!sessionUser) return false;
  const user = await prisma.user.findUnique({ where: { id: sessionUser.id }, select: { role: true } });
  return user?.role === "ADMIN";
}

export async function GET() {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  await connectMongo();
  const buses = await Bus.find().sort({ createdAt: -1 }).lean();
  const layouts = await BusLayout.find({ busId: { $in: buses.map((bus) => bus._id) } }).lean();
  const layoutByBus = new Map(layouts.map((layout) => [layout.busId.toString(), layout]));

  return NextResponse.json(buses.map((bus) => {
    const busId = String(bus._id);
    const layout = layoutByBus.get(busId);
    return {
      id: busId,
      busNumber: bus.busNumber,
      operator: bus.operator,
      description: bus.description || "",
      layoutId: layout ? String(layout._id) : null,
      rows: layout?.rows || 0,
      cols: layout?.cols || 0,
      seatCount: layout?.seats.length || 0,
      decks: layout?.decks || [],
    };
  }));
}

export async function POST(req: NextRequest) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const parsed = layoutSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const duplicateSeat = parsed.data.seats.find((seat, index, seats) =>
    seats.findIndex((candidate) => candidate.seatNo === seat.seatNo && candidate.deck === seat.deck) !== index
  );
  if (duplicateSeat) {
    return NextResponse.json({ error: `Duplicate seat number: ${duplicateSeat.seatNo}` }, { status: 400 });
  }

  try {
    await connectMongo();
    const bus = await Bus.findOneAndUpdate(
      { busNumber: parsed.data.busNumber },
      {
        busNumber: parsed.data.busNumber,
        operator: parsed.data.operator,
        description: parsed.data.description,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const layout = await BusLayout.findOneAndUpdate(
      { busId: bus._id },
      {
        busId: bus._id,
        rows: parsed.data.rows,
        cols: parsed.data.cols,
        decks: parsed.data.decks,
        seats: parsed.data.seats,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    let prismaVehicle = await prisma.vehicle.findFirst({ where: { name: parsed.data.busNumber } });
    if (!prismaVehicle) {
      prismaVehicle = await prisma.vehicle.create({
        data: {
          name: parsed.data.busNumber,
          totalDecks: parsed.data.decks.length,
          seatTemplates: {
            create: parsed.data.seats.map((seat) => ({
              seatNumber: seat.seatNo,
              deck: seat.deck,
              type: seat.type === "SEATER" ? "SEAT" : "SLEEPER",
              rowSpan: 1,
              colSpan: 1,
              xPosition: seat.col,
              yPosition: seat.row,
            })),
          },
        },
      });
    }

    return NextResponse.json({
      bus: { id: bus._id.toString(), busNumber: bus.busNumber, operator: bus.operator, description: bus.description || "" },
      layout: { id: layout._id.toString(), rows: layout.rows, cols: layout.cols, decks: layout.decks, seats: layout.seats },
      vehicle: { id: prismaVehicle.id, name: prismaVehicle.name, totalDecks: prismaVehicle.totalDecks },
    }, { status: 201 });
  } catch (error) {
    console.error("Failed to save bus layout", error);
    return NextResponse.json({ error: "Could not save layout. Check the MongoDB connection." }, { status: 503 });
  }
}
