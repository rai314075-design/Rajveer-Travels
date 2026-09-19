import { getSession } from "@auth0/nextjs-auth0";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.sub) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { phone, code } = await req.json();
  if (typeof phone !== "string" || typeof code !== "string" || !phone.trim() || !/^\d{6}$/.test(code.trim())) return NextResponse.json({ error: "Enter a phone number and a 6-digit phone verification code" }, { status: 400 });
  const existingPhone = await prisma.user.findFirst({ where: { phone: phone.trim(), NOT: { auth0Id: session.user.sub } }, select: { id: true } });
  if (existingPhone) return NextResponse.json({ error: "This phone number already exists. Try another phone number." }, { status: 409 });

  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!serviceSid || !sid || !token) return NextResponse.json({ error: "Phone verification is not configured" }, { status: 503 });

  const form = new URLSearchParams({ To: phone.trim(), Code: code.trim() });
  const response = await fetch(`https://verify.twilio.com/v2/Services/${serviceSid}/VerificationCheck`, {
    method: "POST",
    headers: { Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });
  const result = await response.json();
  if (!response.ok || result.status !== "approved") return NextResponse.json({ error: "The phone verification code is invalid or expired" }, { status: 400 });

  const user = await prisma.user.update({ where: { auth0Id: session.user.sub }, data: { phone: phone.trim(), phoneVerified: true }, select: { phone: true, phoneVerified: true } });
  return NextResponse.json(user);
}
