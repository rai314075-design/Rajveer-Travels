import { createHash } from "crypto";
import { getSession } from "@auth0/nextjs-auth0";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.sub) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { phone, code } = await req.json();
  const normalizedPhone = typeof phone === "string" ? phone.trim().replace(/[^\d+]/g, "") : "";
  if (!/^\+[1-9]\d{7,14}$/.test(normalizedPhone) || typeof code !== "string" || !/^\d{6}$/.test(code.trim())) return NextResponse.json({ error: "Enter a valid phone number and a 6-digit phone verification code" }, { status: 400 });
  const existingPhone = await prisma.user.findFirst({ where: { phone: normalizedPhone, NOT: { auth0Id: session.user.sub } }, select: { id: true } });
  if (existingPhone) return NextResponse.json({ error: "This phone number already exists. Try another phone number." }, { status: 409 });

  const user = await prisma.user.findUnique({ where: { auth0Id: session.user.sub }, select: { pendingPhone: true, phoneOtpHash: true, phoneOtpExpiresAt: true, phoneOtpAttempts: true } });
  const codeHash = createHash("sha256").update(code.trim()).digest("hex");
  if (!user?.pendingPhone || user.pendingPhone !== normalizedPhone || !user.phoneOtpHash || !user.phoneOtpExpiresAt || user.phoneOtpExpiresAt < new Date() || user.phoneOtpAttempts >= 5 || user.phoneOtpHash !== codeHash) {
    if (user && user.phoneOtpAttempts < 5) {
      await prisma.user.update({ where: { auth0Id: session.user.sub }, data: { phoneOtpAttempts: { increment: 1 } } });
    }
    return NextResponse.json({ error: "The phone verification code is invalid or expired" }, { status: 400 });
  }

  const updatedUser = await prisma.user.update({
    where: { auth0Id: session.user.sub },
    data: { phone: normalizedPhone, phoneVerified: true, pendingPhone: null, phoneOtpHash: null, phoneOtpExpiresAt: null, phoneOtpSentAt: null, phoneOtpAttempts: 0 },
    select: { phone: true, phoneVerified: true },
  });
  return NextResponse.json(updatedUser);
}
