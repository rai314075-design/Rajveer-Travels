import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { z } from "zod";

const busSchema = z.object({
  busNumber: z.string().min(2),
  type: z.enum(["AC_SEATER", "AC_SLEEPER", "NON_AC_SEATER", "NON_AC_SLEEPER"]),
  totalSeats: z.number().int().positive(),
  amenities: z.array(z.string()).optional(),
  upiId: z.string().trim().max(255).optional().or(z.literal("")),
  paymentQrUrl: z.string().trim().max(2048).optional().or(z.literal("")),
});

export async function GET() {
  const buses = await prisma.bus.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(buses);
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return NextResponse.json({ error: guard.message }, { status: guard.status });

  const body = await req.json();
  const parsed = busSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const normalizedData = {
    ...parsed.data,
    upiId: parsed.data.upiId?.trim() || null,
    paymentQrUrl: parsed.data.paymentQrUrl?.trim() || null,
  };

  const bus = await prisma.bus.create({ data: normalizedData });
  return NextResponse.json(bus, { status: 201 });
}
