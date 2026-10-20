import { handleAuth, handleCallback, handleLogin } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
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
        ...(connection ? { connection } : {}),
      },
    });
  },
  // Auth0 authorization codes and the transaction (state) cookie are single-use.
  // Replaying a callback — browser refresh/back, double submit, a prefetched
  // link — therefore fails with `invalid_grant` or a missing state cookie. That
  // is expected rather than a real failure, so send the visitor back to the
  // login page instead of surfacing an unhandled error.
  onError: (req: NextRequest, error: any) => {
    const cause = error?.cause;
    const isReplay =
      cause?.error === "invalid_grant" ||
      cause?.errorDescription === "Invalid authorization code" ||
      cause?.name === "MissingStateCookieError" ||
      cause?.name === "MalformedStateCookieError" ||
      /invalid_grant|Invalid authorization code|Missing state cookie/i.test(error?.message || "");

    if (isReplay) {
      console.warn("Auth0 callback replayed — redirecting to login");
      return NextResponse.redirect(new URL("/login?error=session_expired", req.url));
    }

    console.error("Auth0 error", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: error?.status || 500 });
  },
});
