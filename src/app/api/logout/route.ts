import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const response = NextResponse.redirect(new URL("/", req.url));
  for (const cookieName of ["session_token", "appSession", "appSession.legacy"]) {
    response.cookies.set(cookieName, "", { maxAge: 0, path: "/" });
  }
  return response;
}