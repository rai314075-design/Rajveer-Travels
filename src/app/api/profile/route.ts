import { getSession } from "@auth0/nextjs-auth0";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
export const dynamic = "force-dynamic";


const profileSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  phone: z.string().trim().min(1, "Phone number is required").max(30),
  address: z.string().trim().max(500),
  language: z.enum(["ENGLISH", "HINDI"]).default("ENGLISH"),
});

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.sub) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const parsed = profileSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid profile details" }, { status: 400 });

  const currentUser = await prisma.user.findUnique({ where: { auth0Id: session.user.sub }, select: { phone: true, phoneVerified: true } });
  if (!currentUser) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  const phone = parsed.data.phone.trim().replace(/[^\d+]/g, "");
  if (currentUser.phone !== phone || !currentUser.phoneVerified) {
    return NextResponse.json({ error: "Verify the new phone number with OTP before saving" }, { status: 400 });
  }
  const existingPhone = await prisma.user.findFirst({ where: { phone, NOT: { auth0Id: session.user.sub } }, select: { id: true } });
  if (existingPhone) return NextResponse.json({ error: "This phone number already exists. Try another phone number." }, { status: 409 });

  const user = await prisma.user.update({
    where: { auth0Id: session.user.sub },
    data: {
      name: parsed.data.name.trim(),
      phone: phone || null,
      phoneVerified: currentUser.phone === phone ? currentUser.phoneVerified : false,
      address: parsed.data.address || null,
      language: parsed.data.language,
    },
    select: { phone: true, address: true },
  });

  return NextResponse.json(user);
}

export async function GET() {
  const session = await getSession();
  if (!session?.user?.sub) return NextResponse.json({ language: "ENGLISH" });
  const user = await prisma.user.findUnique({ where: { auth0Id: session.user.sub }, select: { language: true } });
  return NextResponse.json({ language: user?.language || "ENGLISH" });
}