import { withMiddlewareAuthRequired, getSession } from "@auth0/nextjs-auth0/edge";
import { NextResponse } from "next/server";

// Every /admin/* route requires a logged-in Auth0 session.
// Role-level enforcement (must be role=ADMIN in Postgres) happens again
// in each admin API route, since the JWT itself doesn't carry our DB role.
export default withMiddlewareAuthRequired(async function middleware(req) {
  const res = NextResponse.next();
  const session = await getSession(req, res);

  if (!session?.user) {
    const returnTo = `${req.nextUrl.pathname}${req.nextUrl.search}`;
    return NextResponse.redirect(
      new URL(`/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`, req.url),
    );
  }
  return res;
});

export const config = {
  matcher: ["/admin/:path*"],
};
