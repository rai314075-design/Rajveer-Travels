import { createHash } from "crypto";
import { getSession } from "@auth0/nextjs-auth0";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.sub) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { code } = await req.json();
  if (typeof code !== "string" || !/^\d{6}$/.test(code)) return NextResponse.json({ error: "Enter the 6-digit email verification code" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { auth0Id: session.user.sub }, select: { emailOtpHash: true, emailOtpExpiresAt: true, pendingEmail: true } });
  const codeHash = createHash("sha256").update(code).digest("hex");
  if (!user?.emailOtpHash || !user.emailOtpExpiresAt || user.emailOtpExpiresAt < new Date() || user.emailOtpHash !== codeHash) {
    return NextResponse.json({ error: "The email verification code is invalid or expired" }, { status: 400 });
  }

  if (!user.pendingEmail) return NextResponse.json({ error: "No email change is waiting for verification" }, { status: 400 });
  const updated = await prisma.user.update({ where: { auth0Id: session.user.sub }, data: { email: user.pendingEmail, emailVerified: true, emailOtpHash: null, emailOtpExpiresAt: null, pendingEmail: null }, select: { email: true, emailVerified: true } });
  return NextResponse.json(updated);
}
