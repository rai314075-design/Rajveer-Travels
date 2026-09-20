import { createHash, randomInt } from "crypto";
import { getSession } from "@auth0/nextjs-auth0";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.sub) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { phone } = await req.json();
  const normalizedPhone = typeof phone === "string" ? phone.trim().replace(/[^\d+]/g, "") : "";
  if (!/^\+[1-9]\d{7,14}$/.test(normalizedPhone)) return NextResponse.json({ error: "Enter a valid phone number with country code, for example +919876543210" }, { status: 400 });
  const existingPhone = await prisma.user.findFirst({ where: { phone: normalizedPhone, NOT: { auth0Id: session.user.sub } }, select: { id: true } });
  if (existingPhone) return NextResponse.json({ error: "This phone number already exists. Try another phone number." }, { status: 409 });

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  const missingSettings = [
    !sid && "TWILIO_ACCOUNT_SID",
    !token && "TWILIO_AUTH_TOKEN",
    !from && "TWILIO_FROM_NUMBER",
  ].filter(Boolean);
  if (missingSettings.length > 0) return NextResponse.json({ error: `Phone verification is not configured. Missing: ${missingSettings.join(", ")}` }, { status: 503 });

  const user = await prisma.user.findUnique({ where: { auth0Id: session.user.sub }, select: { phoneOtpSentAt: true } });
  if (user?.phoneOtpSentAt && Date.now() - user.phoneOtpSentAt.getTime() < 60_000) {
    return NextResponse.json({ error: "Please wait a minute before requesting another code" }, { status: 429 });
  }

  const code = randomInt(100000, 1000000).toString();
  const now = new Date();
  await prisma.user.update({
    where: { auth0Id: session.user.sub },
    data: {
      pendingPhone: normalizedPhone,
      phoneOtpHash: createHash("sha256").update(code).digest("hex"),
      phoneOtpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      phoneOtpSentAt: now,
      phoneOtpAttempts: 0,
    },
  });

  const form = new URLSearchParams({ To: normalizedPhone, From: from as string, Body: `Your Rajveer Travels verification code is ${code}. It expires in 10 minutes.` });
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: { Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });
  if (!response.ok) {
    const twilioResult = await response.json().catch(() => null) as { code?: number; message?: string } | null;
    await prisma.user.update({
      where: { auth0Id: session.user.sub },
      data: { pendingPhone: null, phoneOtpHash: null, phoneOtpExpiresAt: null, phoneOtpSentAt: null, phoneOtpAttempts: 0 },
    });
    console.error("Twilio SMS rejected the phone verification request", { status: response.status, code: twilioResult?.code, message: twilioResult?.message });
    return NextResponse.json({ error: twilioResult?.message || "Twilio could not send the verification code. Check the sender number and recipient country settings." }, { status: 502 });
  }
  return NextResponse.json({ sent: true, phone: normalizedPhone });
}
