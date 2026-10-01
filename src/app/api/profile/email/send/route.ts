import { randomInt, createHash } from "crypto";
import { getSession } from "@auth0/nextjs-auth0";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
export const dynamic = "force-dynamic";


export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.sub) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const parsed = z.object({ email: z.string().email() }).safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findFirst({ where: { email, NOT: { auth0Id: session.user.sub } }, select: { id: true } });
  if (existing) return NextResponse.json({ error: "This email is already registered" }, { status: 409 });
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) return NextResponse.json({ error: "Email verification is not configured" }, { status: 503 });

  const code = randomInt(100000, 1000000).toString();
  const codeHash = createHash("sha256").update(code).digest("hex");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await prisma.user.update({ where: { auth0Id: session.user.sub }, data: { pendingEmail: email, emailOtpHash: codeHash, emailOtpExpiresAt: expiresAt } });

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [email], subject: "Your Rajveer Travels verification code", text: `Your verification code is ${code}. It expires in 10 minutes.` }),
  });
  if (!response.ok) return NextResponse.json({ error: "Could not send email verification code" }, { status: 502 });
  return NextResponse.json({ sent: true });
}
