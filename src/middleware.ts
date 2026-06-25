import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "advisorflow_session";

const PROTECTED = ["/today", "/contacts", "/pipeline", "/dashboard", "/import", "/settings", "/review"];

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET || "advisorflow-dev-secret-change-me";
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const needsAuth = PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!needsAuth) return NextResponse.next();

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  try {
    await jwtVerify(token, getSecret());
    return NextResponse.next();
  } catch {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }
}

export const config = {
  matcher: [
    "/today/:path*",
    "/contacts/:path*",
    "/pipeline/:path*",
    "/dashboard/:path*",
    "/import/:path*",
    "/settings/:path*",
    "/review/:path*",
  ],
};
