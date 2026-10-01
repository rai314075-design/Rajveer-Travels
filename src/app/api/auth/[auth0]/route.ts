import { handleAuth, handleCallback, handleLogin } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
export const dynamic = "force-dynamic";


// Wraps the Auth0 callback so a matching User row is created in Postgres
// the first time someone logs in (auth0Id, email, name synced from the Auth0 profile).
export const GET = handleAuth({
  callback: async (req: NextRequest, ctx: any) => {
    return handleCallback(req, ctx, {
      afterCallback: async (_req: NextRequest, session: any) => {
        if (session?.user) {
          const email = session.user.email ?? `${session.user.sub.replace(/[^a-zA-Z0-9]/g, "_")}@phone.local`;
          const phone = session.user.phone_number ?? null;
          await prisma.user.upsert({
            where: { auth0Id: session.user.sub },
            update: {
              name: session.user.name ?? "Traveler",
              email,
              ...(phone ? { phone, phoneVerified: session.user.phone_number_verified === true } : {}),
              ...(session.user.email_verified === true ? { emailVerified: true } : {}),
            },
            create: {
              auth0Id: session.user.sub,
              name: session.user.name ?? "Traveler",
              email,
              phone,
              phoneVerified: session.user.phone_number_verified === true,
              emailVerified: session.user.email_verified === true,
              role: email === process.env.ADMIN_EMAIL ? "ADMIN" : "USER",
              isSuperAdmin: email === process.env.ADMIN_EMAIL,
            },
          });
        }
        return session;
      },
    });
  },
  login: (req: NextRequest, ctx: any) => {
    const method = req.nextUrl.searchParams.get("method");
    const returnTo = method === "google"
      ? "/"
      : req.nextUrl.searchParams.get("returnTo") || "/";
    const connection = method === "google"
      ? process.env.AUTH0_GOOGLE_CONNECTION
      : method === "phone"
        ? process.env.AUTH0_PHONE_CONNECTION
        : undefined;

    return handleLogin(req, ctx, {
      returnTo,
      authorizationParams: {
        audience: process.env.AUTH0_AUDIENCE,
        ...(connection ? { connection } : {}),
      },
    });
  },
});
